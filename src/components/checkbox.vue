<template>
  <div class="mui-input-group">
    <div class="mui-input-row mui-checkbox" v-for="checking in checkboxgroup" :class="{'mui-left':checking.type == 'left','mui-right':checking.type == 'right'}">
      <label @click="checkMe(checking)">{{checking.content}}</label>
      <input name="checkbox"  type="checkbox" autocomplete="off"
      :checked="checking.checked">
    </div>
  </div>
</template>
<script>
export default {
  props: {
    checkboxgroup: {
      type: Array,
      twoWay: true
    }
  },
  methods: {
    checkMe(obj) {
      obj.checked = !obj.checked
    }
  }
}
</script>
