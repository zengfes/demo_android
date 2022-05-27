<template>
  <div class="form-demo">
    <div class="flex justify-content-center">
      <div class="card">
        <div class="mt-5">
          <img src="../logo.jpg" alt="" height="250" g />
        </div>

        <form class="p-fluid mx-auto p-6 border-round pt-5" id="form">
          <div class="field">
            <h2 class="text-center mt-0 mb-4">註冊</h2>
            <div class="p-float-label">
              <InputText id="name" v-model="state.username" required />
              <label for="name">UserName*</label>
            </div>
          </div>
          <div class="field">
            <div class="p-float-label">
              <InputText
                id="email"
                v-model="state.displayname"
                aria-describedby="email-error"
              />
              <label for="email">DisplayName*</label>
            </div>
          </div>
          <div class="field">
            <div class="p-float-label">
              <Password
                id="password"
                v-model="state.password"
                toggleMask
                required
              >
                <template #header>
                  <h6>Pick a password</h6>
                </template>
                <template #footer="sp">
                  {{ sp.level }}
                  <Divider />
                  <p class="mt-2">Suggestions</p>
                  <ul class="pl-2 ml-2 mt-0" style="line-height: 1.5">
                    <li>At least one lowercase</li>
                    <li>At least one uppercase</li>
                    <li>At least one numeric</li>
                    <li>Minimum 8 characters</li>
                  </ul>
                </template>
              </Password>
              <label for="password">Password*</label>
            </div>
          </div>
          <div class="field">
            <div class="p-float-label">
              <InputText
                id="CredentialName"
                v-model="state.credentialName"
                required
              />
              <label for="name">CredentialName*</label>
            </div>
          </div>

          <!-- <div class="field-checkbox">
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
          </div> -->
          <div id="errors" class="text-pink-500 font-semibold">
            {{ errorText }}
          </div>
          <Button
            type="submit"
            label="Submit"
            @click.prevent="register"
            class="mt-2"
          />
          <router-link to="/" style="text-decoration: none">
            <Button type="submit" label="Login" class="mt-2" />
          </router-link>

          <!-- <button @click="getuser">getUser</button> -->
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, onMounted, ref } from "vue";
// import { email, required } from "@vuelidate/validators";
// import { useVuelidate } from "@vuelidate/core";
import { useRouter } from "vue-router";
import base64js from "base64-js";
import axios from "axios";
const router = useRouter();

onMounted(() => {
  //
});

const errorText = ref("");

const state = reactive({
  username: "",
  displayname: "",
  password: "",
  credentialName: "",
});

//不懂encodedResult
// const getuser = () => {
//   console.log(typeof JSON.stringify("encodedResult"));
// };

// const rules = {
//   name: { required },
//   email: { required, email },
//   password: { required },
//   accept: { required },
// };

// const v$ = useVuelidate(rules, state);

const register = () => {
  // const formData = new FormData(e.target);
  // const userRequest=new UserRequest(
  //     formData.get("username"),
  //     formData.get("display"),
  //     formData.get("pwdname")
  // )
  axios({
    method: "post",
    url: "http://10.20.1.97:8090/api/users/register",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    data: {
      displayName: state.displayname,
      password: state.password,
      username: state.username,
    },
    withCredentials: true,
  })
    .then((response) => {
      console.log(response.data);
      errorText.value = "";
      return response.data;
    })
    .then((credentialCreateJson) => ({
      publicKey: {
        ...credentialCreateJson.publicKey,
        challenge: base64urlToUint8array(
          credentialCreateJson.publicKey.challenge
        ),
        user: {
          ...credentialCreateJson.publicKey.user,
          id: base64urlToUint8array(credentialCreateJson.publicKey.user.id),
        },
        excludeCredentials:
          credentialCreateJson.publicKey.excludeCredentials.map(
            (credential) => ({
              ...credential,
              id: base64urlToUint8array(credential.id),
            })
          ),
        extensions: credentialCreateJson.publicKey.extensions,
      },
    }))
    //雙重驗證
    .then((credentialCreateOptions) =>
      navigator.credentials.create(credentialCreateOptions)
    )
    .then((publicKeyCredential) => ({
      type: publicKeyCredential.type,
      id: publicKeyCredential.id,
      response: {
        attestationObject: uint8arrayToBase64url(
          publicKeyCredential.response.attestationObject
        ),
        clientDataJSON: uint8arrayToBase64url(
          publicKeyCredential.response.clientDataJSON
        ),
        transports:
          (publicKeyCredential.response.getTransports &&
            publicKeyCredential.response.getTransports()) ||
          [],
      },
      clientExtensionResults: publicKeyCredential.getClientExtensionResults(),
    }))
    //不懂
    .then((encodedResult) => {
      const form = document.getElementById("form");
      const formData = new FormData(form);
      formData.append("credential", JSON.stringify(encodedResult));
      console.log(encodedResult);
      console.log(typeof JSON.stringify(encodedResult));
      console.log(JSON.stringify(encodedResult));

      return axios({
        method: "post",
        url: "http://10.20.1.97:8090/api/users/finishauth",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        data: {
          credential: JSON.stringify(encodedResult),
          username: state.username,
          credname: state.credentialName,
        },
        withCredentials: true,
      });
    })
    .then((response) => {
      console.log(response);
    })
    .then(() => {
      router.push({
        name: "Login",
      });
    })
    .catch((error) => {
      displayError(error);
    });
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
    errorText.value = "Duplicate account registration !!";
  }
  console.error(error);
}
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
