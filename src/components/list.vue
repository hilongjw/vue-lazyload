<style>
.img-list ul {
  margin: 0;
  padding: 0;
}

.img-list ul li {
  box-shadow: 0 2px 2px 0 rgba(0, 0, 0, .14), 0 3px 1px -2px rgba(0, 0, 0, .2), 0 1px 5px 0 rgba(0, 0, 0, .12);
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
  -webkit-box-orient: vertical;
  -webkit-box-direction: normal;
  -webkit-flex-direction: column;
  -ms-flex-direction: column;
  flex-direction: column;
  font-size: 16px;
  font-weight: 400;
  min-height: 200px;
  overflow: hidden;
  width: 330px;
  z-index: 1;
  position: relative;
  background: #D6D6D6;
  border-radius: 2px;
  box-sizing: border-box;
  margin: 1rem;
}

.img-list ul li img {
  width: 100%;
}

img[lazy=loading] {
  width: 40px!important;
  margin: auto;
}

img[lazy=error] {
  border-radius: 2px;
}

.cov-imageviewer {
  display: none;
  -webkit-animation-duration: 0.5s;
  animation-duration: 0.5s;
  -webkit-animation-fill-mode: both;
  animation-fill-mode: both;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 200;
  position: fixed;
}

.cov-imageviewer-mask {
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.67);
}

.cov-imageviewer-header img {
  position: fixed;
  margin: 0 auto;
  top: 0;
  width: 100%;
  bottom: 0;
  left: 50%;
  transform: translate(-50%, -50%);
  top: 50%;
}
</style>
<script>
export default {
  data() {
    return {
      list: []
    }
  },
  asyncData: function(resolve, reject) {
    this.$http.get('dist/imgs.json').then(function(response) {
      console.log(response.data)
      resolve({
        list: response.data
      })

    }, function(response) {
      console.log('failed')
    })

  },
  ready() {},
  destroyed() {}
}
</script>
<template>
  <div class="img-list">
    <ul>
      <li v-for="img in list" track-by="$index">
        <img v-lazy="img" width="100%" height="400">
      </li>
    </ul>
  </div>
</template>
