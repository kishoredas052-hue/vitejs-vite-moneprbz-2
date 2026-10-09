export default function LineChart({ data }: { data: number[] }) {
    const width = 300
      const height = 100
        const min = Math.min(...data)
          const max = Math.max(...data)
            const range = max - min || 1

              const points = data
                  .map((v, i) => {
                        const x = (i / (data.length - 1)) * width
                              const y = height - ((v - min) / range) * height
                                    return `${x.toFixed(1)},${y.toFixed(1)}`
                                        })
                                            .join(' ')

                                              return (
                                                  <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-24 mt-4">
                                                        <polyline fill="none" stroke="#22c55e" strokeWidth="2" points={points} />
                                                            </svg>
                                                              )
                                                              }
