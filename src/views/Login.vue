<template>
  <div class="form-demo">
    <div class="flex justify-content-center">
      <div class="card">
        <div class="mt-5">
          <img src="../logo.jpg" alt="" height="250" g />
        </div>

        <form class="p-fluid mx-auto p-6 border-round pt-5">
          <div class="field">
            <h2 class="text-center mt-0 mb-4">登入</h2>
            <div class="p-float-label">
              <InputText
                id="name"
                v-model="state.name"
                :class="{ 'p-invalid': v$.name.$invalid && submitted }"
              />
              <label
                for="name"
                :class="{ 'p-error': v$.name.$invalid && submitted }"
                >Your UserName*</label
              >
            </div>
            <small
              v-if="
                (v$.name.$invalid && submitted) || v$.name.$pending.$response
              "
              class="p-error"
              >{{ v$.name.required.$message.replace("Value", "Name") }}</small
            >
          </div>

          <div class="field-checkbox">
            <Checkbox
              id="accept"
              name="accept"
              value="Accept"
              v-model="v$.accept.$model"
              :class="{ 'p-invalid': v$.accept.$invalid && submitted }"
            />
            <label
              for="accept"
              :class="{ 'p-error': v$.accept.$invalid && submitted }"
              >I agree to the terms and conditions*</label
            >
          </div>
          <div id="errors" class="text-pink-500 font-semibold">
            {{ errorText }}
          </div>
          <router-link to="/register" style="text-decoration: none"
            ><Button type="button" label="Register" class="mt-2"
          /></router-link>
          <div id="credential"></div>

          <Button
            type="submit"
            label="Submit"
            @click.prevent="handleSubmit(!v$.$invalid)"
            class="mt-2"
          />
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from "vue";
import { required } from "@vuelidate/validators";
import { useVuelidate } from "@vuelidate/core";
import axios from "axios";
import base64js from "base64-js";

onMounted(() => {});

const errorText = ref("");

const state = reactive({
  name: "",
  accept: null,
});

const rules = {
  name: { required },
  accept: { required },
};

const submitted = ref(false);

// const showMessage = ref(false);
const v$ = useVuelidate(rules, state);

const handleSubmit = (isFormValid) => {
  submitted.value = true;

  if (!isFormValid) {
    return;
  }

  axios({
    method: "post",
    url: "http://10.20.1.97:8090/api/users/login",
    params: { username: state.name },
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    //API要求的資料
    data: {
      username: state.name,
    },
    withCredentials: true,
  })
    .then((response) => {
      console.log(response.data);
      errorText.value = "";
      return response.data;
    })
    .then((credentialGetJson) => ({
      publicKey: {
        ...credentialGetJson.publicKey,
        allowCredentials:
          credentialGetJson.publicKey.allowCredentials &&
          credentialGetJson.publicKey.allowCredentials.map((credential) => ({
            ...credential,
            id: base64urlToUint8array(credential.id),
          })),
        challenge: base64urlToUint8array(credentialGetJson.publicKey.challenge),
        extensions: credentialGetJson.publicKey.extensions,
      },
    }))
    .then((credentialGetOptions) =>
      navigator.credentials.get(credentialGetOptions)
    )
    .then((publicKeyCredential) => ({
      type: publicKeyCredential.type,
      id: publicKeyCredential.id,
      response: {
        authenticatorData: uint8arrayToBase64url(
          publicKeyCredential.response.authenticatorData
        ),
        clientDataJSON: uint8arrayToBase64url(
          publicKeyCredential.response.clientDataJSON
        ),
        signature: uint8arrayToBase64url(
          publicKeyCredential.response.signature
        ),
        userHandle:
          publicKeyCredential.response.userHandle &&
          uint8arrayToBase64url(publicKeyCredential.response.userHandle),
      },
      clientExtensionResults: publicKeyCredential.getClientExtensionResults(),
    }))
    .then((encodedResult) => {
      //雙重驗證傳回結果
      console.log(encodedResult);
      //   console.log(JSON.stringify(encodedResult));
      document.getElementById("credential").value =
        JSON.stringify(encodedResult);
      //   this.form.submit();
      return axios({
        method: "post",
        url: "http://10.20.1.97:8090/api/users/welcome",
        params: {
          credential: JSON.stringify(encodedResult),
          username: state.name,
        },
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        data: {
          credential: JSON.stringify(encodedResult),
          username: state.username,
        },
        withCredentials: true,
      });
    })
    .then((response) => {
      console.log(response);
    })
    .catch((error) =>
      // console.log(error);
      displayError(error)
    );
};

function base64urlToUint8array(base64Bytes) {
  const padding = "====".substring(0, (4 - (base64Bytes.length % 4)) % 4);
  return base64js.toByteArray(
    (base64Bytes + padding).replace(/\//g, "_").replace(/\+/g, "-")
  );
}
function uint8arrayToBase64url(bytes) {
  if (bytes instanceof Uint8Array) {
    return base64js
      .fromByteArray(bytes)
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "");
  } else {
    return uint8arrayToBase64url(new Uint8Array(bytes));
  }
}

function displayError(error) {
  const a = String(error).includes("500");
  console.log(a);
  if (a == true) {
    errorText.value = "Account not registered !!";
  }

  console.log(error);
}

//
// function checkStatus(response) {
//   if (response.status !== 200) {
//     // throwError(response);
//     console.log("error");
//   } else {
//     return response;
//   }
// }

// function initialCheckStatus(response) {
//   console.log(response.data);
//   checkStatus(response.data);
//   return response.data.json();
// }

// function followRedirect(response) {
//   if (response.status == 200) {
//     window.location.href = response.url;
//   } else {
//     // throwError(response);
//     console.log("error");
//   }
// }

// axios({
//   method: "post",
//   url: "http://10.20.1.97:8090/api/users/welcome",
//   headers: {
//     Accept: "application/json",
//     "Content-Type": "application/json",
//   },
//   data: {
//     username: state.name,
//     credential: "111",
//   },
//   withCredentials: true,
// });

// async function checkCredentials() {
//   const form = document.getElementById("form");
//   const formData = new FormData(form);
//   fetch("http://10.20.1.97:8090/api/users/welcome", {
//     method: "POST",
//     body: formData,
//   })
//     .then((response) => {
//       console.log(response);
//       return initialCheckStatus(response);
//     })
//     .then((credentialGetJson) => ({
//       publicKey: {
//         ...credentialGetJson.publicKey,
//         allowCredentials:
//           credentialGetJson.publicKey.allowCredentials &&
//           credentialGetJson.publicKey.allowCredentials.map((credential) => ({
//             ...credential,
//             id: base64urlToUint8array(credential.id),
//           })),
//         challenge: base64urlToUint8array(credentialGetJson.publicKey.challenge),
//         extensions: credentialGetJson.publicKey.extensions,
//       },
//     }))
//     .then((credentialGetOptions) =>
//       navigator.credentials.get(credentialGetOptions)
//     )
//     .then((publicKeyCredential) => ({
//       type: publicKeyCredential.type,
//       id: publicKeyCredential.id,
//       response: {
//         authenticatorData: uint8arrayToBase64url(
//           publicKeyCredential.response.authenticatorData
//         ),
//         clientDataJSON: uint8arrayToBase64url(
//           publicKeyCredential.response.clientDataJSON
//         ),
//         signature: uint8arrayToBase64url(
//           publicKeyCredential.response.signature
//         ),
//         userHandle:
//           publicKeyCredential.response.userHandle &&
//           uint8arrayToBase64url(publicKeyCredential.response.userHandle),
//       },
//       clientExtensionResults: publicKeyCredential.getClientExtensionResults(),
//     }))
//     .then((encodedResult) => {
//       document.getElementById("credential").value =
//         JSON.stringify(encodedResult);
//       this.form.submit();
//     })
//     .catch((error) => {
//       console.log(error);
//       displayError(error);
//     });
// }
</script>

<style lang="scss" scoped>
.form-demo {
  .card {
    min-width: 450px;

    form {
      margin-top: 2rem;
      width: 60%;
      box-shadow: 0px 0px 2px 1px rgba(0, 0, 0, 0.2);
    }

    .field {
      margin-bottom: 1.5rem;
    }
  }

  @media screen and (max-width: 960px) {
    .card {
      width: 80%;
    }
  }
}
</style>
