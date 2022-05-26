<template>
  <div class="form-demo">
    <div class="flex justify-content-center">
      <div class="card">
        <div class="mt-5">
          <img src="../logo.jpg" alt="" height="250" g />
        </div>

        <form
          @submit.prevent="handleSubmit(!v$.$invalid)"
          class="p-fluid mx-auto p-6 border-round pt-5"
        >
          <div class="field">
            <h2 class="text-center mt-0 mb-4">登入</h2>
            <div class="p-float-label">
              <InputText
                id="name"
                v-model="v$.name.$model"
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
          <router-link to="/register" style="text-decoration: none"
            ><Button type="button" label="Register" class="mt-2"
          /></router-link>

          <Button type="submit" label="Submit" class="mt-2" />
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import { reactive, ref, onMounted } from "vue";
import { email, required } from "@vuelidate/validators";
import { useVuelidate } from "@vuelidate/core";
import CountryService from "/service/CountryService.js";

export default {
  setup() {
    onMounted(() => {
      countryService.value
        .getCountries()
        .then((data) => (countries.value = data));
    });

    const state = reactive({
      name: "",
      email: "",
      password: "",
      accept: null,
    });

    const rules = {
      name: { required },
      email: { required, email },
      password: { required },
      accept: { required },
    };

    const countryService = ref(new CountryService());
    const submitted = ref(false);
    const countries = ref();
    const showMessage = ref(false);
    const date = ref();
    const country = ref();

    const v$ = useVuelidate(rules, state);

    const handleSubmit = (isFormValid) => {
      submitted.value = true;

      if (!isFormValid) {
        return;
      }

      toggleDialog();
    };
    const toggleDialog = () => {
      showMessage.value = !showMessage.value;

      if (!showMessage.value) {
        resetForm();
      }
    };
    const resetForm = () => {
      state.name = "";
      state.email = "";
      state.password = "";
      state.date = null;
      state.country = null;
      state.accept = null;
      submitted.value = false;
    };

    return {
      state,
      v$,
      handleSubmit,
      toggleDialog,
      submitted,
      countries,
      showMessage,
      date,
      country,
    };
  },
};
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
