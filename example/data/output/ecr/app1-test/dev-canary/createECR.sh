#!/bin/bash
set -eux



  aws ecr describe-repositories --region us-east-1 --repository-names -nginx || true

  if [[ $? -ne 0 ]]; then
  aws ecr --region us-east-1 create-repository --repository-name -nginx
  fi



  aws ecr describe-repositories --region us-east-1 --repository-names  || true

  if [[ $? -ne 0 ]]; then
  aws ecr --region us-east-1 create-repository --repository-name 
  fi



  aws ecr describe-repositories --region us-east-1 --repository-names  || true

  if [[ $? -ne 0 ]]; then
  aws ecr --region us-east-1 create-repository --repository-name 
  fi


