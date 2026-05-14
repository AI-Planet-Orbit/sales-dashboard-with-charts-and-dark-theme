import React, { useEffect, useMemo, useRef } from 'react';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

const salesData = {
  kpis: [
    { label: 'Total Revenue', value: '$248,900', change: '+18.2%' },
    { label: 'Orders', value: '4,892', change: '+12.4%' },
    { label: 'Conversion Rate', value: '4.86%', change: '+1.1%' },
    { label: 'Avg. Order Value', value: '$71.20', change: '+7.6%' },
  ],
  monthlyRevenue: [18200, 21400, 19700, 24300, 26800, 30100, 29400, 32200, 35100, 38700, 41200, 45800],
  categorySales: [125000, 98200, 74400, 53100, 42200],
  categoryLabels: ['Electronics', 'Fashion', 'Home', 'Beauty', 'Sports'],
  topProducts: [
    { name: 'Aurora Wireless Headphones', units: 842, revenue: '$42,100' },
    { name: 'Nova Smart Watch', units: 771, revenue: '$38,550' },
    { name: 'Luma Desk Lamp', units: 638, revenue: '$19,140' },
    { name: 'Orbit Backpack', units: 591, revenue: '$17,730' },
    { name: 'Pulse Water Bottle', units: 508, revenue: '$12,700' },
  ],
  regions: [
    { name: 'North America', share: '38%' },
    { name: 'Europe', share: '27%' },
    { name: 'Asia Pacific', share: '21%' },
    { name: 'Latin America', share: '9%' },
    { name: 'Middle East & Africa', share: '5%' },
  ],
};

function useChart(canvasRef, config) {
  useEffect(() => {
    if (!canvasRef.current) return;
    const chart = new Chart(canvasRef.current, config);
    return () => chart.destroy();
  }, [canvasRef, config]);
}

function Card({ children, className = '' }) {
  return <section className={`card ${className}`}>{children}</section>;
}

export default function App() {
  const revenueRef = useRef(null);
  const categoryRef = useRef(null);

  const revenueConfig = useMemo(
    () => ({
      type: 'line',
      data: {
        labels: [
          'Jan',
          'Feb',
          'Mar',
          'Apr',
          'May',
          'Jun',
          'Jul',
          'Aug',
          'Sep',
          'Oct',
          'Nov',
          'Dec',
        ],
        datasets: [
          {
            label: 'Revenue',
            data: salesData.monthlyRevenue,
            borderColor: '#9E7FFF',
            backgroundColor: 'rgba(158, 127, 255, 0.15)',
            tension: 0.35,
            fill: true,
            pointRadius: 4,
            pointHoverRadius: 7,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: { color: '#E5E7EB' },
          },
        },
        scales: {
          x: {
            ticks: { color: '#A3A3A3' },
            grid: { color: 'rgba(255,255,255,0.06)' },
          },
          y: {
            ticks: { color: '#A3A3A3' },
            grid: { color: 'rgba(255,255,255,0.06)' },
          },
        },
      },
    }),
    []
  );

  const categoryConfig = useMemo(
    () => ({
      type: 'doughnut',
      data: {
        labels: salesData.categoryLabels,
        datasets: [
          {
            data: salesData.categorySales,
            backgroundColor: ['#9E7FFF', '#38bdf8', '#f472b6', '#10b981', '#f59e0b'],
            borderColor: '#171717',
            borderWidth: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: '#E5E7EB', padding: 18 },
          },
        },
      },
    }),
    []
  );

  useChart(revenueRef, revenueConfig);
  useChart(categoryRef, categoryConfig);

  return (
    <div className="app-shell">
      <div className="ambient ambient-a" />
      <div className="ambient ambient-b" />

      <header className="hero">
        <div>
          <p className="eyebrow">Sales Intelligence Dashboard</p>
          <h1>Dark-themed revenue analytics for dummy sales data</h1>
          <p className="hero-copy">
            Monitor performance, revenue trends, product categories, and regional reach in one elegant command center.
          </p>
        </div>

        <div className="hero-panel">
          <div className="hero-panel__label">Live Snapshot</div>
          <div className="hero-panel__value">$248.9K</div>
          <div className="hero-panel__meta">+18.2% vs last month</div>
        </div>
      </header>

      <main className="dashboard-grid">
        <section className="kpi-grid" aria-label="Key performance indicators">
          {salesData.kpis.map((item) => (
            <Card key={item.label}>
              <p className="kpi-label">{item.label}</p>
              <div className="kpi-value-row">
                <h2>{item.value}</h2>
                <span className="kpi-change">{item.change}</span>
              </div>
            </Card>
          ))}
        </section>

        <Card className="chart-card chart-card--wide">
          <div className="card-header">
            <div>
              <h3>Monthly Revenue</h3>
              <p>Year-over-year trend across the last 12 months</p>
            </div>
          </div>
          <div className="chart-wrap">
            <canvas ref={revenueRef} />
          </div>
        </Card>

        <Card className="chart-card">
          <div className="card-header">
            <div>
              <h3>Sales by Category</h3>
              <p>Revenue distribution across product groups</p>
            </div>
          </div>
          <div className="chart-wrap">
            <canvas ref={categoryRef} />
          </div>
        </Card>

        <Card className="table-card">
          <div className="card-header">
            <div>
              <h3>Top Products</h3>
              <p>Best-selling items by units and revenue</p>
            </div>
          </div>
          <div className="table-list">
            {salesData.topProducts.map((product, index) => (
              <div className="table-row" key={product.name}>
                <div className="rank">{index + 1}</div>
                <div className="product-info">
                  <strong>{product.name}</strong>
                  <span>{product.units} units sold</span>
                </div>
                <div className="product-revenue">{product.revenue}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="regions-card">
          <div className="card-header">
            <div>
              <h3>Regional Share</h3>
              <p>Sales footprint by market</p>
            </div>
          </div>
          <div className="region-list">
            {salesData.regions.map((region) => (
              <div className="region-item" key={region.name}>
                <span>{region.name}</span>
                <strong>{region.share}</strong>
              </div>
            ))}
          </div>
        </Card>
      </main>
    </div>
  );
}
