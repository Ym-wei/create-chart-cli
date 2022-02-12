<template>
  <div class="chart-<%=defaultName %>">
    <% if (hasChart) { %><EChart
        :ref="`chart_${echartRef}`"
        :options="chartsOption"
        :theme="themeConfig"
        class="echart"
    ></EChart> <% } %>
  </div>
</template>

<script>
  import mixins from '@web-chart/common/mixins'
  <% if (hasChart) { %>import echartMixins from '@web-chart/common/mixins/echart-mixins'<% } %>

  export default {
    name: 'chart-<%=defaultName %>',
    mixins: [mixins<% if (hasChart) { %>, echartMixins<% } %>],
    props: {
      type: {
        type: String,
        default: 'line'
      }
    },
    data() {
      return {}
    },
    computed: {
      <% if (hasChart) { %>chartsOption() {
        const options = {}
        return options
      }<% } %>
    }
  }
</script>
