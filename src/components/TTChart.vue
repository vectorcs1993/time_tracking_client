<template>
  <div class="q-pa-md">
    <div class="row full-width justify-center text-h6 q-mb-md">
      {{ props.label }}
    </div>
    <div class="row q-gutter-sm full-width justify-center">
      <slot name="actions" />
    </div>
    <div v-if="hasData" class="chart-container" :class="{ 'dark-theme': dark }">
      <canvas ref="chartCanvas"></canvas>
    </div>
    <div v-else class="text-center q-pa-lg text-grey-6">
      Нет данных для отображения графика
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed, nextTick, watch } from 'vue'
import {
  Chart,
  BarController,
  LineController,
  PieController,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'

// Регистрируем компоненты
Chart.register(
  BarController,
  LineController,
  PieController,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
)

const props = defineProps({
  label: {
    type: String,
    default: '',
  },
  chartType: {
    type: String,
    default: 'bar',
  },
  dark: {
    type: Boolean,
    default: false
  },
  showLegend: {
    type: Boolean,
    default: true
  },
  showAxisX: {
    type: Boolean,
    default: true
  },
  showAxisY: {
    type: Boolean,
    default: true
  },
});

// Универсальная структура данных - всегда multiple datasets
const modelData = defineModel('data', {
  type: Object,
  default: () => ({
    labels: [],
    datasets: [] // всегда массив объектов { label: string, data: number[], color?: string }
  }),
})

const chartCanvas = ref(null)
let chartInstance = null
let isUpdatingChart = false

// Проверка наличия данных
const hasData = computed(() => {
  return modelData.value?.datasets?.length > 0 &&
    modelData.value.datasets.some(dataset => dataset.data?.length > 0)
})

// Цвета для темной/светлой темы
const themeColors = computed(() => {
  if (props.dark) {
    return {
      text: '#FFFFFF',
      textSecondary: '#B0B0B0',
      grid: 'rgba(255, 255, 255, 0.1)',
      background: 'transparent',
      tooltipBackground: 'rgba(30, 30, 30, 0.9)',
      tooltipText: '#FFFFFF',
      border: 'rgba(255, 255, 255, 0.2)'
    }
  } else {
    return {
      text: '#424242',
      textSecondary: '#757575',
      grid: 'rgba(0, 0, 0, 0.1)',
      background: 'transparent',
      tooltipBackground: 'rgba(0, 0, 0, 0.8)',
      tooltipText: '#FFFFFF',
      border: 'rgba(0, 0, 0, 0.2)'
    }
  }
})

// Цвета по умолчанию для графиков
const defaultColors = [
  '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#C9CBCF',
  '#FF6384A0', '#36A2EBA0', '#FFCE56A0', '#4BC0C0A0', '#9966FFA0', '#FF9F40A0'
]

// Функция для преобразования hex цвета в rgba с прозрачностью
const hexToRgba = (hex, alpha = 0.7) => {
  // Удаляем # если есть
  hex = hex.replace('#', '')

  // Разбираем hex на компоненты
  let r, g, b

  if (hex.length === 3) {
    r = parseInt(hex[0] + hex[0], 16)
    g = parseInt(hex[1] + hex[1], 16)
    b = parseInt(hex[2] + hex[2], 16)
  } else if (hex.length === 6) {
    r = parseInt(hex.substring(0, 2), 16)
    g = parseInt(hex.substring(2, 4), 16)
    b = parseInt(hex.substring(4, 6), 16)
  } else {
    // Возвращаем цвет по умолчанию если некорректный формат
    return {
      background: 'rgba(54, 162, 235, 0.7)',
      border: 'rgba(54, 162, 235, 1)'
    }
  }

  return {
    background: `rgba(${r}, ${g}, ${b}, ${alpha})`,
    border: `rgba(${r}, ${g}, ${b}, 1)`
  }
}

// Получение цветов для датасета
const getDatasetColors = (dataset, index) => {
  // Если указан цвет в dataset, используем его
  if (dataset.color) {
    return hexToRgba(dataset.color, 0.7)
  }

  // Иначе используем цвет по умолчанию из массива
  const colorIndex = index % defaultColors.length
  return hexToRgba(defaultColors[colorIndex], 0.7)
}

// Получение данных для графика
const getChartData = () => {
  const datasets = modelData.value.datasets.map((dataset, index) => {
    const colors = getDatasetColors(dataset, index)

    // Конфигурация в зависимости от типа графика
    const config = {
      label: dataset.label || `Набор данных ${index + 1}`,
      data: [...dataset.data],
      backgroundColor: colors.background,
      borderColor: colors.border,
      borderWidth: 3,
    }

    // Добавляем специфичные настройки для каждого типа графика
    if (props.chartType === 'bar') {
      config.borderRadius = 0
      config.borderSkipped = false
    } else if (props.chartType === 'line') {
      config.tension = 0 // ← Добавить плавность линий
      config.fill = false
      config.pointBackgroundColor = colors.border
      config.pointBorderColor = '#FFFFFF'
      config.pointBorderWidth = 1
      config.pointRadius = 3
      config.pointHoverRadius = 5
    } else if (props.chartType === 'pie') {
      // Для pie chart нужен один dataset со всеми данными
      if (index === 0 && modelData.value.datasets.length === 1) {
        return config
      }
    }

    return config
  })

  // Для pie chart - берем только первый dataset (если есть)
  const finalDatasets = props.chartType === 'pie'
    ? (datasets.length > 0 ? [datasets[0]] : [])
    : datasets

  return {
    labels: [...modelData.value.labels],
    datasets: finalDatasets
  }
}

// Получение настроек графика
const getChartOptions = () => {
  const colors = themeColors.value
  const isPieChart = props.chartType === 'pie'

  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: props.showLegend,
        position: 'top',
        labels: {
          color: colors.text,
          font: {
            size: 14
          },
          padding: 10,
          usePointStyle: isPieChart,
          pointStyle: isPieChart ? 'circle' : 'rect',
          boxWidth: isPieChart ? 10 : 12,
          boxHeight: isPieChart ? 10 : 12,
        },
        onClick: (e, legendItem, legend) => {
          const ci = legend.chart

          if (isPieChart) {
            // Для pie chart скрываем/показываем сегмент
            ci.toggleDataVisibility(legendItem.datasetIndex || legendItem.index)
          } else {
            // Для bar и line chart скрываем/показываем весь dataset
            ci.setDatasetVisibility(legendItem.datasetIndex || legendItem.index,
              !ci.isDatasetVisible(legendItem.datasetIndex || legendItem.index))
          }
          ci.update()
        }
      },
      tooltip: {
        backgroundColor: colors.tooltipBackground,
        titleColor: colors.tooltipText,
        bodyColor: colors.tooltipText,
        padding: 10,
        cornerRadius: 0,
        mode: isPieChart ? 'point' : 'index',
        intersect: true,
        callbacks: isPieChart ? {
          label: (context) => {
            const label = context.label || ''
            const value = context.raw || 0
            const total = context.dataset.data.reduce((a, b) => a + b, 0)
            const percentage = Math.round((value / total) * 100)
            return `${label}: ${value} (${percentage}%)`
          }
        } : undefined,
        displayColors: true,
        usePointStyle: false
      }
    },
    scales: !isPieChart ? {
      y: {
        display: props.showAxisY,
        beginAtZero: true,
        grid: {
          display: props.showAxisY,
          color: colors.grid,
          drawBorder: false
        },
        ticks: {
          color: colors.textSecondary,
          font: {
            size: 12
          }
        },
        border: {
          color: colors.border
        }
      },
      x: {
        display: props.showAxisX,
        grid: {
          display: props.showAxisX,
          color: colors.grid,
          drawBorder: false
        },
        ticks: {
          color: colors.textSecondary,
          font: {
            size: 12
          }
        },
        border: {
          color: colors.border
        }
      }
    } : undefined,
    animation: {
      duration: 0
    },
    elements: {
      line: {
        tension: 0
      },
      bar: {
        borderRadius: 4
      }
    },
    interaction: {
      mode: isPieChart ? 'point' : 'index',
      intersect: false
    }
  }
}

// Обновление графика
const updateChart = async () => {
  if (isUpdatingChart) return

  isUpdatingChart = true

  try {
    if (!hasData.value) {
      if (chartInstance) {
        chartInstance.destroy()
        chartInstance = null
      }
      return
    }

    if (!chartInstance) {
      await nextTick()
      initChart()
      return
    }

    if (chartInstance.config.type !== props.chartType) {
      chartInstance.destroy()
      await nextTick()
      initChart()
    } else {
      chartInstance.data = getChartData()
      chartInstance.options = getChartOptions()
      chartInstance.update('none')
    }
  } finally {
    setTimeout(() => {
      isUpdatingChart = false
    }, 10)
  }
}

// Инициализация графика
const initChart = () => {
  if (!chartCanvas.value || !hasData.value) return

  const ctx = chartCanvas.value.getContext('2d')

  if (chartInstance) {
    chartInstance.destroy()
  }

  chartInstance = new Chart(ctx, {
    type: props.chartType,
    data: getChartData(),
    options: getChartOptions()
  })
}

// Следим за изменениями свойств
watch(() => props.dark, updateChart, { immediate: true })
watch(() => props.chartType, updateChart)
watch(() => props.showLegend, updateChart)
watch(() => props.showAxisX, updateChart)
watch(() => props.showAxisY, updateChart)

// Следим за изменениями данных модели
watch(() => modelData.value, () => {
  if (hasData.value) {
    updateChart()
  } else if (chartInstance) {
    chartInstance.destroy()
    chartInstance = null
  }
}, { deep: true })

// Инициализация при монтировании
onMounted(() => {
  nextTick(() => {
    if (hasData.value) {
      initChart()
    }
  })
})

// Очистка
onBeforeUnmount(() => {
  if (chartInstance) {
    chartInstance.destroy()
    chartInstance = null
  }
})
</script>

<style scoped>
.chart-container {
  position: relative;
  height: 300px;
  width: 100%;
  padding: 8px;
  background: transparent;
  transition: background-color 0.3s ease;
}

/* Адаптивность */
@media (max-width: 600px) {
  .chart-container {
    height: 300px;
    padding: 8px;
  }
}

.chart-container canvas {
  display: block;
  max-width: 100%;
  height: 100% !important;
  width: 100% !important;
}

/* Принудительно меняем цвет текста в легенде для темной темы */
:deep(.dark-theme .chartjs-legend) {
  color: white !important;
}

:deep(.dark-theme .chartjs-legend-text) {
  color: white !important;
}
</style>
