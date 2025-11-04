import { defineModule } from "@directus/extensions-sdk";

import EnvInfoView from "./EnvInfoView.vue";

export default defineModule({
  id: "env-info-module",
  icon: "dns",
  name: "Env information",
  routes: [
    {
      path: "",
      component: EnvInfoView
    }
  ],
  hidden: false
});
