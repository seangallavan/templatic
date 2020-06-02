#!/bin/bash
set -ex

### Set these variables for each project ###
SHORT_NAME=app1-test

### These variables are constant across all environments and do not need to be changed
BITBUCKET_REPO=august-${SHORT_NAME}
DOCKERFILE_NAME=Dockerfile
DOCKERFILE_NGINX=Dockerfile-nginx
DOCKERFILE_VAULT=Dockerfile-vault
LD_LIBRARY_PATH=""
AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}
IMAGE_VERSION=${GIT_COMMIT}
IMAGE_TAG=${IMAGE_VERSION}_b${BUILD_NUMBER}
K8S_NAMESPACE="default"

# Workspace is a jenkins provided env variable for the root job directory
cd ${WORKSPACE}

case "${ENV}" in
    dev-aws)
        SHORT_ENV=dev
        REGION=us-east-1
        REG_ADDRESS="084307953142.dkr.ecr.us-east-1.amazonaws.com"

        SERVICE_NAME=${SHORT_NAME}-${SHORT_ENV}
        NGINX=${SHORT_NAME}-${SHORT_ENV}-nginx
        VAULT=${SHORT_NAME}-${SHORT_ENV}-vault

        DNS=${SHORT_NAME}-${ENV}.august.com

        DASHBOARD_HOSTNAME="${SHORT_ENV}-k8s-dashboard.august.com"

        VAULT_ADDR="https://dev-vault-1:8200"
        VAULT_ROLE_ID=$(cat ${BITBUCKET_REPO}/deploy/vault-role-id.json | jq -r ".[\"${ENV}\"]")
        (VAULT_ADDR=${VAULT_ADDR}  vault login ${VAULT_TOKEN})
        VAULT_SECRET_ID=$(VAULT_ADDR=${VAULT_ADDR}  vault write auth/approle/role/app-role-${SHORT_NAME}/secret-id -format=json | jq -r .data.secret_id)

        # Setup vault agent
        mkdir -p vault/etc

        cat << 'EOF' > vault/etc/vault-agent.hcl
pid_file = "/tmp/vault.pid"
auto_auth {
  method "approle" {
    config = {
      role_id_file_path = "/tmp/vault-role-id"
      secret_id_file_path = "/tmp/vault-secret-id"
      remove_secret_id_file_after_reading = 0
    }
  }
  sink "file" {
    wrap_ttl = "1000m"
    config = {
      path = "/tmp/vault-token"
    }
  }
}
cache {
  use_auto_auth_token = true
}
listener "tcp" {
  address = "0.0.0.0:8100"
  tls_disable = true
}
EOF

        # Adding bitbucket ssh key
        cat "${AUGUST_BITBUCKET_KEY}" > id_rsa_august_bitbucket

        # Adding august-runtime-creds so we can test the container
        mkdir august-runtime-creds
        cat "${VAULT_CRT}" > august-runtime-creds/vault.crt
        cat "${AUGUST_COM_CHAINED_CRT}" > august-runtime-creds/august.com.chained.crt
        cat "${AUGUST_COM_KEY}" > august-runtime-creds/august.com.key

        cp -pr ./${BITBUCKET_REPO}/deploy/. .

        # Expand service dockerfile
        jinja2 \
        -D node_env=${ENV} \
        ${DOCKERFILE_NAME}.j2 > ${DOCKERFILE_NAME}

        # Expand nginx conf
        jinja2 \
        -D main_dns=${DNS} \
        nginx.conf.j2 > nginx.conf

        jinja2 \
          -D vault_role_id=${VAULT_ROLE_ID} \
          -D vault_secret_id=${VAULT_SECRET_ID} \
          -D vault_addr=${VAULT_ADDR} \
        ${DOCKERFILE_VAULT}.j2 > ${DOCKERFILE_VAULT}

        docker build --no-cache -f ${DOCKERFILE_NAME} -t ${SERVICE_NAME}:${IMAGE_TAG} .
        docker build --no-cache -f ${DOCKERFILE_NGINX} -t ${NGINX}:${IMAGE_TAG} .
        docker build --no-cache  -f ${DOCKERFILE_VAULT} -t ${VAULT}:${IMAGE_VERSION} .

        docker rm -f ${SERVICE_NAME} || true
        docker rm -f ${NGINX} || true
        docker rm -f ${VAULT} || true

        #/root/august-runtime-creds managed separately on the Jenkins box in each environment
        docker run -d --name ${SERVICE_NAME} \
        --mount type=bind,src=${WORKSPACE}/august-runtime-creds,target=/root/august-runtime-creds \
        --mount type=bind,src=${WORKSPACE}/vault/etc,target=/vault/etc \
        --network test \
        -e "NODE_ENV=${ENV}" \
        -e "VAULT_ADDR=http://${VAULT}:8100" \
        -p 5296:3030 \
        -i ${SERVICE_NAME}:${IMAGE_TAG}

        #/root/august-runtime-creds managed separately on the Jenkins box in each environment
        docker run -d --name ${NGINX} \
        --mount type=bind,src=${WORKSPACE}/august-runtime-creds,target=/root/august-runtime-creds \
        --network test \
        -p 5297:443 \
        -i ${NGINX}:${IMAGE_TAG}

        docker run -d --name ${VAULT} \
        --mount type=bind,src=${WORKSPACE}/august-runtime-creds,target=/home/vault/august-runtime-creds \
        --mount type=bind,src=${WORKSPACE}/vault/etc,target=/vault/etc \
        --network test \
        -e "VAULT_ADDR=${VAULT_ADDR}" \
        -e 'VAULT_CACERT=/home/vault/august-runtime-creds/vault.crt' \
        -e 'VAULT_ROLE_ID=$VAULT_ROLE_ID' \
        -e 'VAULT_SECRET_ID=$VAULT_SECRET_ID' \
        -i ${VAULT}:${IMAGE_VERSION} \
        bash -c "vault agent -config /vault/etc/vault-agent.hcl"

        ATTEMPTS=1
        while ! curl -k --fail "http://localhost:5296/health"; do
            sleep 1
            let "ATTEMPTS+=1"
            if [ ${ATTEMPTS} -gt 120 ]; then
            echo "${SERVICE_NAME} FAILED TO RESPOND WITHIN 2 MINUTES"
                echo "${SERVICE_NAME} LOGS ################################################"
                docker logs ${SERVICE_NAME}
                exit 1
            fi
        done

        ATTEMPTS=1
        while ! curl -k --fail "https://localhost:5297/ping"; do
            sleep 1
            let "ATTEMPTS+=1"
            if [ ${ATTEMPTS} -gt 120 ]; then
            echo "${SERVICE_NAME} FAILED TO RESPOND WITHIN 2 MINUTES"
                echo "${NGINX} LOGS ################################################"
                docker logs ${NGINX}
                exit 1
            fi
        done

        docker rm -f ${SERVICE_NAME} || true
        docker rm -f ${NGINX} || true

        # Removing bitbucket ssh key
        rm -f id_rsa_august_bitbucket

        # Removing august-runtime-creds
        rm -rf august-runtime-creds

        echo "Finished cleaning up prerequisites."

        # Login to ECR Repository
        LOGIN_STRING=`aws ecr get-login --region ${REGION} --no-include-email`
        ${LOGIN_STRING}

        docker tag ${SERVICE_NAME}:${IMAGE_TAG} ${REG_ADDRESS}/${SERVICE_NAME}:${IMAGE_TAG}
        docker push ${REG_ADDRESS}/${SERVICE_NAME}:${IMAGE_TAG}

        docker tag ${NGINX}:${IMAGE_TAG} ${REG_ADDRESS}/${NGINX}:${IMAGE_TAG}
        docker push ${REG_ADDRESS}/${NGINX}:${IMAGE_TAG}

        docker tag ${VAULT}:${IMAGE_TAG} ${REG_ADDRESS}/${VAULT}:${IMAGE_TAG}
        docker push ${REG_ADDRESS}/${VAULT}:${IMAGE_TAG}

        docker tag ${SERVICE_NAME}:${IMAGE_TAG} ${REG_ADDRESS}/${SERVICE_NAME}:latest
        aws ecr batch-delete-image --region ${REGION} --repository-name "${SERVICE_NAME}" --image-ids imageTag="latest"
        docker push ${REG_ADDRESS}/${SERVICE_NAME}:latest

        docker tag ${NGINX}:${IMAGE_TAG} ${REG_ADDRESS}/${NGINX}:latest
        aws ecr batch-delete-image --region ${REGION} --repository-name "${NGINX}" --image-ids imageTag="latest"
        docker push ${REG_ADDRESS}/${NGINX}:latest

        docker tag ${VAULT}:${IMAGE_TAG} ${REG_ADDRESS}/${VAULT}:latest
        aws ecr batch-delete-image --region ${REGION} --repository-name "${VAULT}" --image-ids imageTag="latest"
        docker push ${REG_ADDRESS}/${VAULT}:latest

        kubectl set env deployment/${SERVICE_NAME} --overwrite=true \
        --containers=${VAULT} VAULT_ROLE_ID=$VAULT_ROLE_ID VAULT_SECRET_ID=$VAULT_SECRET_ID \
        --token="${SECRET_k8s_token}"

        kubectl set image deployment/${SERVICE_NAME} \
        ${SERVICE_NAME}=${REG_ADDRESS}/${SERVICE_NAME}:${IMAGE_TAG} \
        ${NGINX}=${REG_ADDRESS}/${NGINX}:${IMAGE_TAG} \
        ${VAULT}=${REG_ADDRESS}/${VAULT}:${IMAGE_TAG} \
        --record \
        --token=${K8S_TOKEN}

        if kubectl rollout status deployment/${SERVICE_NAME} --namespace=default --token=${K8S_TOKEN};
            then
                curl -X POST -H 'Content-type: application/json' --data "{\"attachments\": [
                        {
                            \"fallback\": \"Deployment Successful: ${SERVICE_NAME}\",
                            \"color\": \"good\",
                            \"author_name\": \"K8s Deployment Rollout\",
                            \"title\": \"Successful deployment for ${SERVICE_NAME}\",
                            \"title_link\": \"https://${DASHBOARD_HOSTNAME}/#!/deployment/${K8S_NAMESPACE}/${SERVICE_NAME}\",
                            \"text\": \"Image tag: ${IMAGE_TAG}\",
                            \"footer\": \"K8\",
                            \"footer_icon\": \"https://raw.githubusercontent.com/kubernetes/kubernetes/master/logo/logo.png\",
                            \"ts\": $(date +%s)
                        }
                    ]}" ${SLACK_URL}

                echo "Deployment successful"

                exit 0
            else
                echo "Deployment failedl"

                kubectl rollout undo deployment/${SERVICE_NAME} --token=${K8S_TOKEN}

                curl -X POST -H 'Content-type: application/json' --data "{\"attachments\": [
                        {
                            \"fallback\": \"Deployment Failed: ${SERVICE_NAME}. Rollback Successful\",
                            \"color\": \"danger\",
                            \"author_name\": \"K8s Deployment Rollout\",
                            \"title\": \"Deployment for ${SERVICE_NAME} FAILED \",
                            \"title_link\": \"https://${DASHBOARD_HOSTNAME}/#!/deployment/${K8S_NAMESPACE}/${SERVICE_NAME}\",
                            \"text\": \"```Image tag: ${IMAGE_TAG}```\",
                            \"footer\": \"K8\",
                            \"footer_icon\": \"https://raw.githubusercontent.com/kubernetes/kubernetes/master/logo/logo.png\",
                            \"ts\": $(date +%s)
                        }
                    ]}" ${SLACK_URL}

                exit 1
        fi
        ;;
    stage-aws)
        SHORT_ENV=stage
        REGION=us-west-2
        REG_ADDRESS="084307953142.dkr.ecr.us-west-2.amazonaws.com"

        SERVICE_NAME=${SHORT_NAME}-${SHORT_ENV}
        NGINX=${SHORT_NAME}-${SHORT_ENV}-nginx
        VAULT=${SHORT_NAME}-${SHORT_ENV}-vault

        DNS=${SHORT_NAME}-${ENV}.august.com

        DASHBOARD_HOSTNAME="stage-k8s-dashboard.august.com"

        VAULT_ADDR="https://prod-vault-1:8200"
        VAULT_ROLE_ID=$(cat ${BITBUCKET_REPO}/deploy/vault-role-id.json | jq -r ".[\"${ENV}\"]")
        (VAULT_ADDR=${VAULT_ADDR}  vault login ${VAULT_TOKEN})
        VAULT_SECRET_ID=$(VAULT_ADDR=${VAULT_ADDR}  vault write auth/approle/role/app-role-${SHORT_NAME}/secret-id -format=json | jq -r .data.secret_id)

         # Setup vault agent
        mkdir -p vault/etc

        cat << 'EOF' > vault/etc/vault-agent.hcl
pid_file = "/tmp/vault.pid"
auto_auth {
  method "approle" {
    config = {
      role_id_file_path = "/tmp/vault-role-id"
      secret_id_file_path = "/tmp/vault-secret-id"
      remove_secret_id_file_after_reading = 0
    }
  }
  sink "file" {
    wrap_ttl = "1000m"
    config = {
      path = "/tmp/vault-token"
    }
  }
}
cache {
  use_auto_auth_token = true
}
listener "tcp" {
  address = "0.0.0.0:8100"
  tls_disable = true
}
EOF

       # Check git tag to determine whether or not to run the build
        cd ${BITBUCKET_REPO}
        SERVER_TAG=`git describe --abbrev=0 --tags`

        if [ "$(aws ecr list-images --repository-name ${SERVICE_NAME}| jq '.imageIds[].imageTag' | grep ${SERVER_TAG})" == "" ];
            then
                echo "NEW TAG DETECTED: Continuing build"
            else
                echo "NO NEW TAG DETECTED: Stopping build"
                echo "TAG: ${SERVER_TAG} already exists"
                exit 1
        fi

        cd ${WORKSPACE}

        # Adding bitbucket ssh key
        cat "${AUGUST_BITBUCKET_KEY}" > id_rsa_august_bitbucket

        # Adding august-runtime-creds so we can test the container
        mkdir august-runtime-creds
        cat "${VAULT_CRT}" > august-runtime-creds/vault.crt
        cat "${AUGUST_COM_CHAINED_CRT}" > august-runtime-creds/august.com.chained.crt
        cat "${AUGUST_COM_KEY}" > august-runtime-creds/august.com.key

        cp -pr ./${BITBUCKET_REPO}/deploy/. .

        # Expand dockerfile
        jinja2 \
        -D node_env=${ENV} \
        ${DOCKERFILE_NAME}.j2 > ${DOCKERFILE_NAME}

        # Expand nginx conf
        jinja2 \
        -D main_dns=${DNS} \
        nginx.conf.j2 > nginx.conf

        jinja2 \
          -D vault_role_id=${VAULT_ROLE_ID} \
          -D vault_secret_id=${VAULT_SECRET_ID} \
          -D vault_addr=${VAULT_ADDR} \
        ${DOCKERFILE_VAULT}.j2 > ${DOCKERFILE_VAULT}

        docker build --no-cache -f ${DOCKERFILE_NAME} -t ${SERVICE_NAME}:${SERVER_TAG} .
        docker build --no-cache -f ${DOCKERFILE_NGINX} -t ${NGINX}:${SERVER_TAG} .
        docker build --no-cache  -f ${DOCKERFILE_VAULT} -t ${VAULT}:${IMAGE_VERSION} .

        docker rm -f ${SERVICE_NAME} || true
        docker rm -f ${NGINX} || true
        docker rm -f ${VAULT} || true

        #/root/august-runtime-creds managed separately on the Jenkins box in each environment
        docker run -d --name ${SERVICE_NAME} \
        --mount type=bind,src=${WORKSPACE}/august-runtime-creds,target=/root/august-runtime-creds \
        --mount type=bind,src=${WORKSPACE}/vault/etc,target=/vault/etc \
        --network test \
        -e "NODE_ENV=${ENV}" \
        -e "VAULT_ADDR=http://${VAULT}:8100" \
        -p 5296:3030 \
        -i ${SERVICE_NAME}:${SERVER_TAG}

        #/root/august-runtime-creds managed separately on the Jenkins box in each environment
        docker run -d --name ${NGINX} \
        --mount type=bind,src=${WORKSPACE}/august-runtime-creds,target=/root/august-runtime-creds \
        --network test \
        -p 5297:443 \
        -i ${NGINX}:${SERVER_TAG}

        docker run -d --name ${VAULT} \
        --mount type=bind,src=${WORKSPACE}/august-runtime-creds,target=/home/vault/august-runtime-creds \
        --mount type=bind,src=${WORKSPACE}/vault/etc,target=/vault/etc \
        --network test \
        -e "VAULT_ADDR=${VAULT_ADDR}" \
        -e 'VAULT_CACERT=/home/vault/august-runtime-creds/vault.crt' \
        -e 'VAULT_ROLE_ID=$VAULT_ROLE_ID' \
        -e 'VAULT_SECRET_ID=$VAULT_SECRET_ID' \
        -i ${VAULT}:${IMAGE_VERSION} \
        bash -c "vault agent -config /vault/etc/vault-agent.hcl"

        ATTEMPTS=1
        while ! curl -k --fail "http://localhost:5296/health"; do
            sleep 1
            let "ATTEMPTS+=1"
            if [ ${ATTEMPTS} -gt 120 ]; then
            echo "${SERVICE_NAME} FAILED TO RESPOND WITHIN 2 MINUTES"
                echo "${SERVICE_NAME} LOGS ################################################"
                docker logs ${SERVICE_NAME}
                exit 1
            fi
        done

        ATTEMPTS=1
        while ! curl -k --fail "https://localhost:5297/ping"; do
            sleep 1
            let "ATTEMPTS+=1"
            if [ ${ATTEMPTS} -gt 120 ]; then
            echo "${SERVICE_NAME} FAILED TO RESPOND WITHIN 2 MINUTES"
                echo "${NGINX} LOGS ################################################"
                docker logs ${NGINX}
                exit 1
            fi
        done

        docker rm -f ${SERVICE_NAME} || true
        docker rm -f ${NGINX} || true

        # Removing bitbucket ssh key
        rm -f id_rsa_august_bitbucket

        # Removing august-runtime-creds
        rm -rf august-runtime-creds

        echo "Finished cleaning up prerequisites."

        # Login to ECR Repository
        LOGIN_STRING=`aws ecr get-login --region ${REGION} --no-include-email`
        ${LOGIN_STRING}

        docker tag ${SERVICE_NAME}:${SERVER_TAG} ${REG_ADDRESS}/${SERVICE_NAME}:${SERVER_TAG}
        docker push ${REG_ADDRESS}/${SERVICE_NAME}:${SERVER_TAG}

        docker tag ${NGINX}:${SERVER_TAG} ${REG_ADDRESS}/${NGINX}:${SERVER_TAG}
        docker push ${REG_ADDRESS}/${NGINX}:${SERVER_TAG}

        docker tag ${VAULT}:${IMAGE_TAG} ${REG_ADDRESS}/${VAULT}:${IMAGE_TAG}
        docker push ${REG_ADDRESS}/${VAULT}:${IMAGE_TAG}

        docker tag ${SERVICE_NAME}:${SERVER_TAG} ${REG_ADDRESS}/${SERVICE_NAME}:latest
        aws ecr batch-delete-image --region ${REGION} --repository-name "${SERVICE_NAME}" --image-ids imageTag="latest"
        docker push ${REG_ADDRESS}/${SERVICE_NAME}:latest

        docker tag ${NGINX}:${SERVER_TAG} ${REG_ADDRESS}/${NGINX}:latest
        aws ecr batch-delete-image --region ${REGION} --repository-name "${NGINX}" --image-ids imageTag="latest"
        docker push ${REG_ADDRESS}/${NGINX}:latest

        docker tag ${VAULT}:${IMAGE_TAG} ${REG_ADDRESS}/${VAULT}:latest
        aws ecr batch-delete-image --region ${REGION} --repository-name "${VAULT}" --image-ids imageTag="latest"
        docker push ${REG_ADDRESS}/${VAULT}:latest

        kubectl set env deployment/${SERVICE_NAME} --overwrite=true \
        --containers=${VAULT} VAULT_ROLE_ID=$VAULT_ROLE_ID VAULT_SECRET_ID=$VAULT_SECRET_ID \
        --token="${SECRET_k8s_token}"

        kubectl set image deployment/${SERVICE_NAME} \
        ${SERVICE_NAME}=${REG_ADDRESS}/${SERVICE_NAME}:${SERVER_TAG} \
        ${NGINX}=${REG_ADDRESS}/${NGINX}:${SERVER_TAG} \
        ${VAULT}=${REG_ADDRESS}/${VAULT}:${IMAGE_TAG} \
        --record \
        --token=${K8S_TOKEN}

        if kubectl rollout status deployment/${SERVICE_NAME} --namespace=default --token=${K8S_TOKEN};
            then
                curl -X POST -H 'Content-type: application/json' --data "{\"attachments\": [
                        {
                            \"fallback\": \"Deployment Successful: ${SERVICE_NAME}\",
                            \"color\": \"good\",
                            \"author_name\": \"K8s Deployment Rollout\",
                            \"title\": \"Successful deployment for ${SERVICE_NAME}\",
                            \"title_link\": \"https://${DASHBOARD_HOSTNAME}/#!/deployment/${K8S_NAMESPACE}/${SERVICE_NAME}\",
                            \"text\": \"Image tag: ${SERVER_TAG}\",
                            \"footer\": \"K8\",
                            \"footer_icon\": \"https://raw.githubusercontent.com/kubernetes/kubernetes/master/logo/logo.png\",
                            \"ts\": $(date +%s)
                        }
                    ]}" ${SLACK_URL}

                echo "Deployment successful"

                exit 0
            else
                echo "Deployment failedl"

                kubectl rollout undo deployment/${SERVICE_NAME} --token=${K8S_TOKEN}

                curl -X POST -H 'Content-type: application/json' --data "{\"attachments\": [
                        {
                            \"fallback\": \"Deployment Failed: ${SERVICE_NAME}. Rollback Successful\",
                            \"color\": \"danger\",
                            \"author_name\": \"K8s Deployment Rollout\",
                            \"title\": \"Deployment for ${SERVICE_NAME} FAILED\",
                            \"title_link\": \"https://${DASHBOARD_HOSTNAME}/#!/deployment/${K8S_NAMESPACE}/${SERVICE_NAME}\",
                            \"text\": \"Image tag: ${SERVER_TAG}\",
                            \"footer\": \"K8\",
                            \"footer_icon\": \"https://raw.githubusercontent.com/kubernetes/kubernetes/master/logo/logo.png\",
                            \"ts\": $(date +%s)
                        }
                    ]}" ${SLACK_URL}

                exit 1
        fi
        ;;
    prod-aws)
        SHORT_ENV=prod
        REGION=us-west-2
        REG_ADDRESS="084307953142.dkr.ecr.us-west-2.amazonaws.com"

        SERVICE_NAME=${SHORT_NAME}-${SHORT_ENV}
        NGINX=${SHORT_NAME}-${SHORT_ENV}-nginx
        VAULT=${SHORT_NAME}-${SHORT_ENV}-vault

        DNS=${SHORT_NAME}-${ENV}.august.com

        DASHBOARD_HOSTNAME="prod-k8s-dashboard.august.com"

        VAULT_ADDR="https://prod-vault-1:8200"
        VAULT_ROLE_ID=$(cat ${BITBUCKET_REPO}/deploy/vault-role-id.json | jq -r ".[\"${ENV}\"]")
        (VAULT_ADDR=${VAULT_ADDR}  vault login ${VAULT_TOKEN})
        VAULT_SECRET_ID=$(VAULT_ADDR=${VAULT_ADDR}  vault write auth/approle/role/app-role-${SHORT_NAME}/secret-id -format=json | jq -r .data.secret_id)

        # Setup vault agent
        mkdir -p vault/etc

        cat << 'EOF' > vault/etc/vault-agent.hcl
pid_file = "/tmp/vault.pid"
auto_auth {
  method "approle" {
    config = {
      role_id_file_path = "/tmp/vault-role-id"
      secret_id_file_path = "/tmp/vault-secret-id"
      remove_secret_id_file_after_reading = 0
    }
  }
  sink "file" {
    wrap_ttl = "1000m"
    config = {
      path = "/tmp/vault-token"
    }
  }
}
cache {
  use_auto_auth_token = true
}
listener "tcp" {
  address = "0.0.0.0:8100"
  tls_disable = true
}
EOF

        # Check git tag to determine whether or not to run the build
        cd ${BITBUCKET_REPO}
        SERVER_TAG=`git describe --abbrev=0 --tags`

        if [ "$(aws ecr list-images --repository-name ${SERVICE_NAME}| jq '.imageIds[].imageTag' | grep ${SERVER_TAG})" == "" ];
            then
                echo "NEW TAG DETECTED: Continuing build"
            else
                echo "NO NEW TAG DETECTED: Stopping build"
                echo "TAG: ${SERVER_TAG} already exists"
                exit 1
        fi

        cd ${WORKSPACE}

        # Adding bitbucket ssh key
        cat "${AUGUST_BITBUCKET_KEY}" > id_rsa_august_bitbucket

        # Adding august-runtime-creds so we can test the container
        mkdir august-runtime-creds
        cat "${VAULT_CRT}" > august-runtime-creds/vault.crt
        cat "${AUGUST_COM_CHAINED_CRT}" > august-runtime-creds/august.com.chained.crt
        cat "${AUGUST_COM_KEY}" > august-runtime-creds/august.com.key

        cp -pr ./${BITBUCKET_REPO}/deploy/. .

        # Expand dockerfile
        jinja2 \
        -D node_env=${ENV} \
        ${DOCKERFILE_NAME}.j2 > ${DOCKERFILE_NAME}

        # Expand nginx conf
        jinja2 \
        -D main_dns=${DNS} \
        nginx.conf.j2 > nginx.conf

        jinja2 \
          -D vault_role_id=${VAULT_ROLE_ID} \
          -D vault_secret_id=${VAULT_SECRET_ID} \
          -D vault_addr=${VAULT_ADDR} \
        ${DOCKERFILE_VAULT}.j2 > ${DOCKERFILE_VAULT}

        docker build --no-cache -f ${DOCKERFILE_NAME} -t ${SERVICE_NAME}:${SERVER_TAG} .
        docker build --no-cache -f ${DOCKERFILE_NGINX} -t ${NGINX}:${SERVER_TAG} .
        docker build --no-cache  -f ${DOCKERFILE_VAULT} -t ${VAULT}:${IMAGE_VERSION} .

        docker rm -f ${SERVICE_NAME} || true
        docker rm -f ${NGINX} || true
        docker rm -f ${VAULT} || true

        #/root/august-runtime-creds managed separately on the Jenkins box in each environment
        docker run -d --name ${SERVICE_NAME} \
        --mount type=bind,src=${WORKSPACE}/august-runtime-creds,target=/root/august-runtime-creds \
        --mount type=bind,src=${WORKSPACE}/vault/etc,target=/vault/etc \
        --network test \
        -e "NODE_ENV=${ENV}" \
        -e "VAULT_ADDR=http://${VAULT}:8100" \
        -p 5296:3030 \
        -i ${SERVICE_NAME}:${SERVER_TAG}

        #/root/august-runtime-creds managed separately on the Jenkins box in each environment
        docker run -d --name ${NGINX} \
        --mount type=bind,src=${WORKSPACE}/august-runtime-creds,target=/root/august-runtime-creds \
        --network test \
        -p 5297:443 \
        -i ${NGINX}:${SERVER_TAG}

        docker run -d --name ${VAULT} \
        --mount type=bind,src=${WORKSPACE}/august-runtime-creds,target=/home/vault/august-runtime-creds \
        --mount type=bind,src=${WORKSPACE}/vault/etc,target=/vault/etc \
        --network test \
        -e "VAULT_ADDR=${VAULT_ADDR}" \
        -e 'VAULT_CACERT=/home/vault/august-runtime-creds/vault.crt' \
        -e 'VAULT_ROLE_ID=$VAULT_ROLE_ID' \
        -e 'VAULT_SECRET_ID=$VAULT_SECRET_ID' \
        -i ${VAULT}:${IMAGE_VERSION} \
        bash -c "vault agent -config /vault/etc/vault-agent.hcl"

        ATTEMPTS=1
        while ! curl -k --fail "http://localhost:5296/health"; do
            sleep 1
            let "ATTEMPTS+=1"
            if [ ${ATTEMPTS} -gt 120 ]; then
            echo "${SERVICE_NAME} FAILED TO RESPOND WITHIN 2 MINUTES"
                echo "${SERVICE_NAME} LOGS ################################################"
                docker logs ${SERVICE_NAME}
                exit 1
            fi
        done

        ATTEMPTS=1
        while ! curl -k --fail "https://localhost:5297/ping"; do
            sleep 1
            let "ATTEMPTS+=1"
            if [ ${ATTEMPTS} -gt 120 ]; then
            echo "${SERVICE_NAME} FAILED TO RESPOND WITHIN 2 MINUTES"
                echo "${NGINX} LOGS ################################################"
                docker logs ${NGINX}
                exit 1
            fi
        done

        docker rm -f ${SERVICE_NAME} || true
        docker rm -f ${NGINX} || true

        # Removing bitbucket ssh key
        rm -f id_rsa_august_bitbucket

        # Removing august-runtime-creds
        rm -rf august-runtime-creds

        echo "Finished cleaning up prerequisites."

        # Login to ECR Repository
        LOGIN_STRING=`aws ecr get-login --region ${REGION} --no-include-email`
        ${LOGIN_STRING}

        docker tag ${SERVICE_NAME}:${SERVER_TAG} ${REG_ADDRESS}/${SERVICE_NAME}:${SERVER_TAG}
        docker push ${REG_ADDRESS}/${SERVICE_NAME}:${SERVER_TAG}

        docker tag ${NGINX}:${SERVER_TAG} ${REG_ADDRESS}/${NGINX}:${SERVER_TAG}
        docker push ${REG_ADDRESS}/${NGINX}:${SERVER_TAG}

        docker tag ${VAULT}:${IMAGE_TAG} ${REG_ADDRESS}/${VAULT}:${IMAGE_TAG}
        docker push ${REG_ADDRESS}/${VAULT}:${IMAGE_TAG}

        docker tag ${SERVICE_NAME}:${SERVER_TAG} ${REG_ADDRESS}/${SERVICE_NAME}:latest
        aws ecr batch-delete-image --region ${REGION} --repository-name "${SERVICE_NAME}" --image-ids imageTag="latest"
        docker push ${REG_ADDRESS}/${SERVICE_NAME}:latest

        docker tag ${NGINX}:${SERVER_TAG} ${REG_ADDRESS}/${NGINX}:latest
        aws ecr batch-delete-image --region ${REGION} --repository-name "${NGINX}" --image-ids imageTag="latest"
        docker push ${REG_ADDRESS}/${NGINX}:latest

        docker tag ${VAULT}:${IMAGE_TAG} ${REG_ADDRESS}/${VAULT}:latest
        aws ecr batch-delete-image --region ${REGION} --repository-name "${VAULT}" --image-ids imageTag="latest"
        docker push ${REG_ADDRESS}/${VAULT}:latest

        kubectl set env deployment/${SERVICE_NAME} --overwrite=true \
        --containers=${VAULT} VAULT_ROLE_ID=$VAULT_ROLE_ID VAULT_SECRET_ID=$VAULT_SECRET_ID \
        --token="${SECRET_k8s_token}"

        kubectl set image deployment/${SERVICE_NAME} \
        ${SERVICE_NAME}=${REG_ADDRESS}/${SERVICE_NAME}:${SERVER_TAG} \
        ${NGINX}=${REG_ADDRESS}/${NGINX}:${SERVER_TAG} \
        ${VAULT}=${REG_ADDRESS}/${VAULT}:${IMAGE_TAG} \
        --record \
        --token=${K8S_TOKEN}

        if kubectl rollout status deployment/${SERVICE_NAME} --namespace=default --token=${K8S_TOKEN};
            then
                curl -X POST -H 'Content-type: application/json' --data "{\"attachments\": [
                        {
                            \"fallback\": \"Deployment Successful: ${SERVICE_NAME}\",
                            \"color\": \"good\",
                            \"author_name\": \"K8s Deployment Rollout\",
                            \"title\": \"Successful deployment for ${SERVICE_NAME}\",
                            \"title_link\": \"https://${DASHBOARD_HOSTNAME}/#!/deployment/${K8S_NAMESPACE}/${SERVICE_NAME}\",
                            \"text\": \"Image tag: ${SERVER_TAG}\",
                            \"footer\": \"K8\",
                            \"footer_icon\": \"https://raw.githubusercontent.com/kubernetes/kubernetes/master/logo/logo.png\",
                            \"ts\": $(date +%s)
                        }
                    ]}" ${SLACK_URL}

                echo "Deployment successful"

                exit 0
            else
                echo "Deployment failedl"

                kubectl rollout undo deployment/${SERVICE_NAME} --token=${K8S_TOKEN}

                curl -X POST -H 'Content-type: application/json' --data "{\"attachments\": [
                        {
                            \"fallback\": \"Deployment Failed: ${SERVICE_NAME}. Rollback Successful\",
                            \"color\": \"danger\",
                            \"author_name\": \"K8s Deployment Rollout\",
                            \"title\": \"Deployment for ${SERVICE_NAME} FAILED\",
                            \"title_link\": \"https://${DASHBOARD_HOSTNAME}/#!/deployment/${K8S_NAMESPACE}/${SERVICE_NAME}\",
                            \"text\": \"Image tag: ${SERVER_TAG}\",
                            \"footer\": \"K8\",
                            \"footer_icon\": \"https://raw.githubusercontent.com/kubernetes/kubernetes/master/logo/logo.png\",
                            \"ts\": $(date +%s)
                        }
                    ]}" ${SLACK_URL}

                exit 1
        fi
        ;;
    china-aws)
        echo "NEEDS TO BE DONE"
        ;;
    *)
        echo "Invalid ENV variable provided"
        exit 1
esac
