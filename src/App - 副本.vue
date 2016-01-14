<template>
  <div>
    <button @click="showAlert">kai</button>
    <alert :show.sync="alertData.show" :title="alertData.title" :content="alertData.content" :callback="alertData.callback"></alert>
    <checkbox :checkboxgroup.sync="checkboxGroupData"></checkbox>
    <span>{{checkboxGroupData | json}}</span>
    <list></list>
  </div>
</template>
<script>
import list from './components/list.vue'
import alert from './components/alert.vue'
import checkbox from './components/checkbox.vue'

export default {
  data() {
    return {
      alertData: {
        show: false,
        title: 'Hello Vue',
        content: '欢迎使用vue',
        callback: function() {
          console.log('done')
        }
      },
      checkboxGroupData: [{
        checked: false,
        content: 'checkbox1',
        type: 'left'
      },
      {
        checked: false,
        content: 'checkbox2',
        type: 'right'
      },
      {
        checked: false,
        content: 'checkbox3',
        type: 'left'
      }]
    }
  },
  methods: {
    showAlert() {
      this.alertData.show = !this.alertData.show
    }
  },
  components: {
    alert,
    checkbox,
    list
  }
}
</script>
<style src="./assets/css/mui.css"></style>
