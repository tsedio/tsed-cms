function externals() {
  return {
    name: "external-plus", // this name will show up in logs and errors
    version: "1.0.0",
    options(rawOptions) {
      if (rawOptions.external?.includes("directus:api")) {
        rawOptions.external.push("@directus/api/cache");
      }

      return rawOptions;
    }
  };
}

export default {
  plugins: [externals()]
};
