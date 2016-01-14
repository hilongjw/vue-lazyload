<template>
  <div v-show="show">
    <div class="mui-popup mui-popup-in" style="display: block;">
      <div class="mui-popup-inner">
        <div class="mui-popup-title">{{title}}</div>
        <div class="mui-popup-text">{{content}}</div>
      </div>
      <div class="mui-popup-buttons" @click="confirm"><span class="mui-popup-button mui-popup-button-bold">确定</span></div>
    </div>
    <div class="mui-popup-backdrop mui-active" style="display: block;"></div>
  </div>
</template>

<script>
export default {
  props: {
    title: {
      type: String
    },
    content: {
      type: String
    },
    show: {
      type: Boolean,
      default: true,
      twoWay: true
    },
    callback: {
      type: Function
    }
  },
  methods: {
    confirm() {
      this.callback()
      this.show = false
    }
  }
}
</script>
