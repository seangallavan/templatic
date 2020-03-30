'use strict';

module.exports.shouldBuild = function shouldBuild() {
  return true;
};

module.exports.template = `
---
# From global variables
var1: {{ var1 }}
var2: {{ var2 }}
var3: {{ var3 }}
var4: {{ var4 }}
var5: {{ var5 }}
var6: {{ var6 }}
var7: {{ var7 }}
var8: {{ var8 }}
var9: {{ var9 }}
var10: {{ var10 }}
var11: {{ var11 }}
var12: {{ var12 }}
var13: {{ var13 }}
var14: {{ var14 }}
var15: {{ var15 }}
var16: {{ var16 }}
var17: {{ var17 }}
var18: {{ var18 }}
var19: {{ var19 }}
var20: {{ var20 }}
var21: {{ var21 }}
var22: {{ var22 }}
var23: {{ var23 }}
var24: {{ var24 }}
var25: {{ var25 }}
var26: {{ var26 }}
var27: {{ var27 }}
var28: {{ var28 }}
var29: {{ var29 }}
var30: {{ var30 }}
var31: {{ var31 }}
var32: {{ var32 }}
var33: {{ var33 }}
var34: {{ var34 }}
var35: {{ var35 }}
var36: {{ var36 }}

# From global templates
globalTemplateFromApplication: "{{ globalTemplateFromApplication }}"
globalTemplateFromApplication2: "{{ globalTemplateFromApplication2 }}"

# Containers
containers:
{% for container in containers %}
  - name: "{{ container.name }}-{{ env }}"
    var41: {{ var41 }}
    var42: {{ var42 }}
    var43: {{ var43 }}
    var44: {{ var44 }}
    var45: {{ var45 }}
    var46: {{ var46 }}
    var47: {{ var47 }}
    var48: {{ var48 }}
    var49: {{ var49 }}
    var50: {{ var50 }}
    var51: {{ var51 }}
    var52: {{ var52 }}
    var53: {{ var53 }}
    var54: {{ var54 }}
    var55: {{ var55 }}
    var56: {{ var56 }}
    var57: {{ var57 }}
    var58: {{ var58 }}
    var59: {{ var59 }}
    var60: {{ var60 }}
    var61: {{ var61 }}
    
    # Environment variables
    environmentVariables:
      {% for key, val in container.environmentVariables %}
      - name: "{{ key }}"
        value: "{{ val }}"
      {% endfor %}
{% endfor %}
`.trim();