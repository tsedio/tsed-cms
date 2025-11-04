<script setup lang="ts">
import {onMounted, ref} from "vue";
import {useApi} from "@directus/extensions-sdk";
import {Item} from "@directus/types";

const page_description = "This page displays the current version information";
const version = ref<string>("Loading...");
const branch = ref<string>("Loading...");

const tableItems = ref<Item[]>([]);
const tableHeaders = ref<any[]>([
  {
    text: "Name",
    value: "name",
    sortable: false,
    align: "left",
    width: 300
  },
  {
    text: "Value",
    value: "value",
    sortable: false,
    align: "left"
  }
]);

const api = useApi();

onMounted(async () => {
  try {
    const res = await api.get("/env-info/version");

    version.value = "" + res.data?.version; //force to string
    branch.value = "" + res.data?.branch; //force to string

    tableItems.value = Object
        .entries(res.data?.env || {})
        .map(([name, value]) => {
          return {
            name: name.toUpperCase(),
            value
          }
        })
  } catch (error: any) {
    version.value = error.message;
  }
});
</script>
<template>
  <private-view title="Env information" class="info-view">
    <template #title-outer:prepend>
      <v-button class="header-icon" rounded icon exact disabled>
        <v-icon name="dns"/>
      </v-button>
    </template>

    <template #sidebar>
      <sidebar-detail icon="info" title="Env information" close>
        <div v-md="page_description" class="page-description"/>
      </sidebar-detail>
    </template>

    <div class="content">
      <div>
        <VDivider>
          <template #icon>
            <v-icon name="tag"/>
          </template>
          <template #default>Version</template>
        </VDivider>
        <div class="tags">
          <v-chip color="primary">{{ version }}</v-chip>
          <v-chip color="primary">{{ branch }}</v-chip>
        </div>
      </div>

      <div v-if="tableHeaders.length">
        <VDivider>
          <template #icon>
            <v-icon name="settings_panorama"/>
          </template>
          <template #default>Environment</template>
        </VDivider>

        <VTable :headers="tableHeaders" :items="tableItems"></VTable>
      </div>
    </div>
  </private-view>
</template>

<style scoped lang="css">
.info-view {
  --info-gap: 32px;
}

.tags {
  margin-top: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.content {
  display: flex;
  flex-direction: column;
  gap: var(--info-gap);
  padding: var(--content-padding);
}

.header-icon {
  --v-button-color-disabled: var(--theme--foreground);
}

</style>
