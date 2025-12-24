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
  // Единицы измерения для оси Y
  yAxisUnit: {
    type: String,
    default: ''
  },
  // Режим штриховки для всех dataset
  useHatchPattern: {
    type: Boolean,
    default: false
  }
})

// Универсальная структура данных - всегда multiple datasets
const modelData = defineModel('data', {
  type: Object,
  default: () => ({
    labels: [],
    datasets: [] // всегда массив объектов { label: string, data: number[], color?: string, hatch?: boolean }
  }),
})

const chartCanvas = ref(null)
let chartInstance = null
let isUpdatingChart = false

// Кэш для паттернов штриховки
const hatchPatternsCache = new Map()

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

// Функция для создания паттерна штриховки
const createHatchPattern = (color, type = 'diagonal', size = 12) => {
  const cacheKey = `${color}_${type}_${size}_${props.dark}`

  if (hatchPatternsCache.has(cacheKey)) {
    return hatchPatternsCache.get(cacheKey)
  }

  const patternCanvas = document.createElement('canvas')
  patternCanvas.width = size
  patternCanvas.height = size
  const ctx = patternCanvas.getContext('2d')

  // Фон паттерна (полностью прозрачный или с легким фоном)
  ctx.fillStyle = props.dark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)'
  ctx.fillRect(0, 0, size, size)

  // Рисуем штриховку в зависимости от типа
  ctx.strokeStyle = color
  ctx.lineWidth = 2
  ctx.lineCap = 'round'

  if (type === 'diagonal') {
    // Диагональная штриховка
    ctx.beginPath()
    ctx.moveTo(0, size)
    ctx.lineTo(size, 0)
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(-size / 2, size)
    ctx.lineTo(size, -size / 2)
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(size / 2, size)
    ctx.lineTo(size + size / 2, -size / 2)
    ctx.stroke()
  } else if (type === 'horizontal') {
    // Горизонтальная штриховка
    ctx.beginPath()
    ctx.moveTo(0, size / 2)
    ctx.lineTo(size, size / 2)
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(0, size / 4)
    ctx.lineTo(size, size / 4)
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(0, 3 * size / 4)
    ctx.lineTo(size, 3 * size / 4)
    ctx.stroke()
  } else if (type === 'vertical') {
    // Вертикальная штриховка
    ctx.beginPath()
    ctx.moveTo(size / 2, 0)
    ctx.lineTo(size / 2, size)
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(size / 4, 0)
    ctx.lineTo(size / 4, size)
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(3 * size / 4, 0)
    ctx.lineTo(3 * size / 4, size)
    ctx.stroke()
  } else if (type === 'cross') {
    // Перекрестная штриховка
    ctx.beginPath()
    ctx.moveTo(0, size / 2)
    ctx.lineTo(size, size / 2)
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(size / 2, 0)
    ctx.lineTo(size / 2, size)
    ctx.stroke()
  } else if (type === 'grid') {
    // Сетка
    ctx.lineWidth = 1
    ctx.beginPath()
    // Вертикальные линии
    for (let i = 0; i <= size; i += size / 4) {
      ctx.moveTo(i, 0)
      ctx.lineTo(i, size)
    }
    // Горизонтальные линии
    for (let i = 0; i <= size; i += size / 4) {
      ctx.moveTo(0, i)
      ctx.lineTo(size, i)
    }
    ctx.stroke()
  } else if (type === 'dots') {
    // Точечный паттерн
    ctx.fillStyle = color
    const dotSize = 2
    for (let x = dotSize; x < size; x += size / 4) {
      for (let y = dotSize; y < size; y += size / 4) {
        ctx.beginPath()
        ctx.arc(x, y, dotSize, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  }

  const pattern = ctx.createPattern(patternCanvas, 'repeat')
  hatchPatternsCache.set(cacheKey, pattern)

  return pattern
}

// Функция для форматирования значений на оси Y
const formatYAxisValue = (value) => {
  if (typeof value !== 'number') return value

  const unit = props.yAxisUnit || ''

  // Автоматическое определение количества знаков после запятой
  const maxAbsValue = Math.max(...modelData.value.datasets.flatMap(d => d.data).map(Math.abs))

  let decimals
  if (maxAbsValue < 10) {
    decimals = 2
  } else if (maxAbsValue < 100) {
    decimals = 1
  } else {
    decimals = 0
  }

  // Форматируем число
  let formattedValue
  try {
    // Простое форматирование с разделителями тысяч
    if (value % 1 === 0) {
      // Целое число
      formattedValue = value.toLocaleString('ru-RU')
    } else {
      // Дробное число
      formattedValue = value.toFixed(decimals).replace('.', ',')

      // Добавляем разделители тысяч для целой части
      const parts = formattedValue.split(',')
      if (parts[0].length > 3) {
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
      }
      formattedValue = parts.join(',')
    }
  } catch {
    // Fallback
    formattedValue = value.toString()
  }

  // Добавляем единицы измерения
  if (unit) {
    return `${formattedValue} ${unit}`
  }

  return formattedValue
}

// Функция для форматирования значений в tooltip
const formatTooltipValue = (value) => {
  if (typeof value !== 'number') return value

  // Для tooltip показываем больше знаков после запятой
  let formattedValue
  try {
    if (value % 1 === 0) {
      formattedValue = value.toLocaleString('ru-RU')
    } else {
      formattedValue = value.toFixed(4).replace('.', ',')

      // Убираем лишние нули в конце
      formattedValue = formattedValue.replace(/,?0+$/, '')
      if (formattedValue.endsWith(',')) {
        formattedValue = formattedValue.slice(0, -1)
      }

      // Добавляем разделители тысяч
      const parts = formattedValue.split(',')
      if (parts[0].length > 3) {
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
      }
      formattedValue = parts.join(',')
    }
  } catch {
    formattedValue = value.toString()
  }

  return formattedValue
}

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
    return hexToRgba(dataset.color, dataset.hatchOpacity || 0.7)
  }

  // Иначе используем цвет по умолчанию из массива
  const colorIndex = index % defaultColors.length
  return hexToRgba(defaultColors[colorIndex], dataset.hatchOpacity || 0.7)
}

// Получение данных для графика
const getChartData = () => {
  const datasets = modelData.value.datasets.map((dataset, index) => {
    const colors = getDatasetColors(dataset, index)
    const useHatch = dataset.hatch !== undefined ? dataset.hatch : props.useHatchPattern
    const hatchType = dataset.hatchType || 'diagonal'

    // Определяем цвета заливки
    let backgroundColor, borderColor

    if (useHatch && props.chartType !== 'pie') {
      // Для штриховки используем паттерн
      const mainColor = dataset.color || defaultColors[index % defaultColors.length]
      backgroundColor = createHatchPattern(mainColor, hatchType, dataset.hatchSize || 18)
      borderColor = colors.border
    } else {
      // Обычная заливка цветом
      backgroundColor = colors.background
      borderColor = colors.border
    }

    // Конфигурация в зависимости от типа графика
    const config = {
      label: dataset.label || `Набор данных ${index + 1}`,
      data: [...dataset.data],
      backgroundColor: backgroundColor,
      borderColor: borderColor,
      borderWidth: 3,
    }

    // Добавляем специфичные настройки для каждого типа графика
    if (props.chartType === 'bar') {
      config.borderRadius = 0
      config.borderSkipped = false
    } else if (props.chartType === 'line') {
      config.tension = dataset.tension !== undefined ? dataset.tension : 0
      config.fill = dataset.fill !== undefined ? dataset.fill : false
      config.pointBackgroundColor = borderColor
      config.pointBorderColor = props.dark ? '#121212' : '#FFFFFF'
      config.pointBorderWidth = 1
      config.pointRadius = dataset.pointRadius !== undefined ? dataset.pointRadius : 3
      config.pointHoverRadius = dataset.pointHoverRadius !== undefined ? dataset.pointHoverRadius : 5

      // Для line chart с штриховкой заливки
      if (useHatch && config.fill) {
        // Создаем отдельный плагин для заливки штриховкой в line chart
        config.fill = 'origin'
      }
    } else if (props.chartType === 'pie') {
      // Для pie chart нужен один dataset со всеми данными
      if (index === 0 && modelData.value.datasets.length === 1) {
        config.backgroundColor = Array.isArray(config.backgroundColor)
          ? config.backgroundColor
          : [config.backgroundColor]
        config.borderColor = Array.isArray(config.borderColor)
          ? config.borderColor
          : [config.borderColor]
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
  const isLineChart = props.chartType === 'line'

  // Callback для форматирования значений на оси Y
  const yAxisTicksCallback = {
    callback: function (value) {
      return formatYAxisValue(value)
    }
  }

  const options = {
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
        } : {
          // Добавляем единицы измерения в tooltip
          label: (context) => {
            const label = context.dataset.label || ''
            const value = context.parsed.y
            return `${label}: ${formatTooltipValue(value)}`
          }
        },
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
          },
          padding: 8,
          ...yAxisTicksCallback
        },
        border: {
          color: colors.border
        },
        // Отключаем заголовок оси
        title: {
          display: false
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
          },
          padding: 8
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
        borderRadius: 0
      }
    },
    interaction: {
      mode: isPieChart ? 'point' : 'index',
      intersect: false
    }
  }

  // Добавляем кастомную логику для заливки line chart штриховкой
  if (isLineChart) {
    options.plugins = {
      ...options.plugins,
      afterDatasetsDraw: (chart) => {
        const ctx = chart.ctx
        chart.data.datasets.forEach((dataset, datasetIndex) => {
          const meta = chart.getDatasetMeta(datasetIndex)
          if (!meta.hidden && dataset.fill) {
            ctx.save()
            ctx.beginPath()

            // Рисуем верхнюю линию графика
            meta.data.forEach((point, index) => {
              if (index === 0) {
                ctx.moveTo(point.x, point.y)
              } else {
                ctx.lineTo(point.x, point.y)
              }
            })

            // Замыкаем путь до оси X
            const lastPoint = meta.data[meta.data.length - 1]
            const firstPoint = meta.data[0]
            ctx.lineTo(lastPoint.x, chart.chartArea.bottom)
            ctx.lineTo(firstPoint.x, chart.chartArea.bottom)
            ctx.closePath()

            // Если используется штриховка, применяем паттерн
            if (dataset.hatch && typeof dataset.backgroundColor === 'object') {
              ctx.fillStyle = dataset.backgroundColor
              ctx.fill()
            }

            ctx.restore()
          }
        })
      }
    }
  }

  return options
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

// Очистка кэша паттернов при изменении темы
watch(() => props.dark, () => {
  hatchPatternsCache.clear()
  updateChart()
}, { immediate: true })

// Следим за изменениями свойств
watch(() => props.chartType, updateChart)
watch(() => props.showLegend, updateChart)
watch(() => props.showAxisX, updateChart)
watch(() => props.showAxisY, updateChart)
// Следим за изменениями единиц измерения
watch(() => props.yAxisUnit, updateChart)
// Следим за изменением режима штриховки
watch(() => props.useHatchPattern, updateChart)

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
  hatchPatternsCache.clear()
})

// Экспортируем функции для работы с штриховкой
defineExpose({
  updateChart,
  clearCache: () => hatchPatternsCache.clear()
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
