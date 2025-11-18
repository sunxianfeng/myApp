// Performance monitoring utilities
import React, { useEffect, ReactElement } from 'react'

export interface PerformanceMetrics {
  name: string
  startTime: number
  endTime?: number
  duration?: number
  metadata?: Record<string, any>
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetrics> = new Map()

  startTimer(name: string, metadata?: Record<string, any>): void {
    this.metrics.set(name, {
      name,
      startTime: performance.now(),
      metadata,
    })
  }

  endTimer(name: string): PerformanceMetrics | null {
    const metric = this.metrics.get(name)
    if (!metric) {
      console.warn(`No timer found for: ${name}`)
      return null
    }

    const endTime = performance.now()
    const duration = endTime - metric.startTime

    const completedMetric: PerformanceMetrics = {
      ...metric,
      endTime,
      duration,
    }

    this.metrics.set(name, completedMetric)
    this.logMetric(completedMetric)

    return completedMetric
  }

  private logMetric(metric: PerformanceMetrics): void {
    if (process.env.NODE_ENV === 'development') {
      console.log(`⏱️ ${metric.name}: ${metric.duration?.toFixed(2)}ms`, metric.metadata || '')
    }

    // Send to analytics service in production
    if (process.env.NODE_ENV === 'production' && metric.duration) {
      this.sendToAnalytics(metric)
    }
  }

  private async sendToAnalytics(metric: PerformanceMetrics): Promise<void> {
    try {
      // Example: Send to your analytics service
      if (typeof window !== 'undefined' && 'gtag' in window) {
        (window as any).gtag('event', 'performance_metric', {
          metric_name: metric.name,
          duration: metric.duration,
          custom_parameters: metric.metadata,
        })
      }
    } catch (error) {
      console.warn('Failed to send performance metric:', error)
    }
  }

  getMetric(name: string): PerformanceMetrics | undefined {
    return this.metrics.get(name)
  }

  getAllMetrics(): PerformanceMetrics[] {
    return Array.from(this.metrics.values())
  }

  clearMetrics(): void {
    this.metrics.clear()
  }

  // Web Vitals monitoring
  observeWebVitals(): void {
    if (typeof window === 'undefined') return

    // Check if PerformanceObserver is available
    if (typeof PerformanceObserver === 'undefined') {
      console.warn('PerformanceObserver is not supported in this browser')
      return
    }

    try {
      // Largest Contentful Paint (LCP)
      new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries()
        const lastEntry = entries[entries.length - 1] as any
        
        this.logMetric({
          name: 'LCP',
          startTime: 0,
          endTime: lastEntry.startTime,
          duration: lastEntry.startTime,
          metadata: {
            element: lastEntry.element?.tagName,
            url: lastEntry.url,
          },
        })
      }).observe({ entryTypes: ['largest-contentful-paint'] })

      // First Input Delay (FID)
      new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries()
        entries.forEach((entry: any) => {
          this.logMetric({
            name: 'FID',
            startTime: 0,
            endTime: entry.processingStart - entry.startTime,
            duration: entry.processingStart - entry.startTime,
            metadata: {
              inputType: entry.name,
            },
          })
        })
      }).observe({ entryTypes: ['first-input'] })

      // Cumulative Layout Shift (CLS)
      let clsValue = 0
      new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries()
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value
          }
        })

        this.logMetric({
          name: 'CLS',
          startTime: 0,
          endTime: 0,
          duration: clsValue,
          metadata: {
            value: clsValue,
          },
        })
      }).observe({ entryTypes: ['layout-shift'] })
    } catch (error) {
      console.warn('Failed to observe web vitals:', error)
    }
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor()

// Initialize web vitals monitoring
if (typeof window !== 'undefined') {
  performanceMonitor.observeWebVitals()
}

// React hook for performance monitoring
export const usePerformanceMonitor = () => {
  const measureComponentRender = (componentName: string) => {
    return {
      start: () => performanceMonitor.startTimer(`${componentName}_render`),
      end: () => performanceMonitor.endTimer(`${componentName}_render`),
    }
  }

  const measureApiCall = (apiName: string) => {
    return {
      start: () => performanceMonitor.startTimer(`api_${apiName}`),
      end: () => performanceMonitor.endTimer(`api_${apiName}`),
    }
  }

  return {
    monitor: performanceMonitor,
    measureComponentRender,
    measureApiCall,
  }
}

// Higher-order component for performance monitoring
export function withPerformanceMonitoring<P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
): React.ComponentType<P> {
  const WrappedComponent = (props: P) => {
    useEffect(() => {
      performanceMonitor.startTimer(`${componentName}_mount`)
      return () => {
        performanceMonitor.endTimer(`${componentName}_mount`)
      }
    }, [componentName])

    return React.createElement(Component, props)
  }

  WrappedComponent.displayName = `withPerformanceMonitoring(${componentName})`
  return WrappedComponent
}

export default performanceMonitor
