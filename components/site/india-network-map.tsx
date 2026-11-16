'use client'

import { INDIA_PROJECTION, INDIA_STATES, INDIA_VIEWBOX } from '@/lib/geo/india-states'

type City = Record<string, any>

const CITY_COORDS: Record<string, [number, number]> = {
  mumbai: [72.88, 19.08], bengaluru: [77.59, 12.97], bangalore: [77.59, 12.97], delhi: [77.21, 28.61], 'delhi ncr': [77.21, 28.61],
  'new delhi': [77.21, 28.61], gurugram: [77.03, 28.46], gurgaon: [77.03, 28.46], noida: [77.39, 28.54], pune: [73.86, 18.52],
  hyderabad: [78.49, 17.39], ahmedabad: [72.57, 23.02], chennai: [80.27, 13.08], kolkata: [88.36, 22.57], coimbatore: [76.96, 11.02],
  jaipur: [75.79, 26.91], lucknow: [80.95, 26.85], chandigarh: [76.78, 30.73], indore: [75.86, 22.72], nagpur: [79.09, 21.15],
  bhubaneswar: [85.82, 20.3], guwahati: [91.74, 26.14], kochi: [76.27, 9.93], visakhapatnam: [83.22, 17.69], surat: [72.83, 21.17],
  vadodara: [73.18, 22.31], bhopal: [77.41, 23.26], patna: [85.14, 25.59], ranchi: [85.31, 23.34], dehradun: [78.03, 30.32],
  ludhiana: [75.86, 30.9], thiruvananthapuram: [76.94, 8.52], mysuru: [76.64, 12.3], madurai: [78.12, 9.93], raipur: [81.63, 21.25],
  goa: [73.83, 15.49], nashik: [73.79, 20.0], varanasi: [82.97, 25.32], kanpur: [80.33, 26.45], jammu: [74.86, 32.73],
  siliguri: [88.4, 26.73], mangaluru: [74.86, 12.91], vijayawada: [80.65, 16.51], jamshedpur: [86.18, 22.8], rajkot: [70.8, 22.3],
  jodhpur: [73.02, 26.24], agra: [78.01, 27.18], srinagar: [74.8, 34.08], amritsar: [74.87, 31.63], shillong: [91.89, 25.58],
  aurangabad: [75.34, 19.88], udaipur: [73.71, 24.58], imphal: [93.94, 24.82], 'tiruchirappalli': [78.69, 10.79], hubli: [75.12, 15.36],
}

const NETWORK_CITIES = [
  'srinagar', 'amritsar', 'ludhiana', 'dehradun', 'jaipur', 'jodhpur', 'udaipur', 'agra', 'lucknow', 'kanpur', 'varanasi', 'patna',
  'siliguri', 'guwahati', 'shillong', 'imphal', 'ranchi', 'jamshedpur', 'bhubaneswar', 'raipur', 'nagpur', 'bhopal', 'indore',
  'rajkot', 'surat', 'vadodara', 'nashik', 'aurangabad', 'goa', 'hubli', 'mangaluru', 'mysuru', 'kochi', 'thiruvananthapuram',
  'madurai', 'tiruchirappalli', 'vijayawada', 'visakhapatnam', 'chandigarh', 'noida',
]

function project([lng, lat]: [number, number]) {
  const { scale, translateX, translateY } = INDIA_PROJECTION
  const lambda = (lng * Math.PI) / 180
  const phi = (lat * Math.PI) / 180
  return [scale * lambda + translateX, translateY - scale * Math.log(Math.tan(Math.PI / 4 + phi / 2))] as const
}

function cityPosition(city: City, fallback: [number, number]) {
  const coords = CITY_COORDS[String(city.name || '').trim().toLowerCase()]
  if (coords) {
    const [x, y] = project(coords)
    return { left: (x / INDIA_VIEWBOX.width) * 100, top: (y / INDIA_VIEWBOX.height) * 100 }
  }
  const mx = Number(city.mapX)
  const my = Number(city.mapY)
  if (city.mapX !== '' && city.mapX != null && Number.isFinite(mx) && Number.isFinite(my)) return { left: mx, top: my }
  return { left: fallback[0], top: fallback[1] }
}

const STATE_ALIASES: Record<string, string> = { 'delhi ncr': 'delhi', orissa: 'odisha', uttaranchal: 'uttarakhand' }
const normalize = (name: string) => {
  const key = name.trim().toLowerCase()
  return STATE_ALIASES[key] ?? key
}

export function IndiaNetworkMap({
  cities,
  activeCityName,
  highlightedState,
  onSelectCity,
}: {
  cities: City[]
  activeCityName?: string
  highlightedState?: string
  onSelectCity: (city: City) => void
}) {
  const highlight = highlightedState ? normalize(highlightedState) : ''
  const network = NETWORK_CITIES.map((name) => project(CITY_COORDS[name]))

  return (
    <div className="footprint-map-art relative aspect-[400/470] h-full max-h-full w-auto max-w-full">
      <svg
        viewBox={`0 0 ${INDIA_VIEWBOX.width} ${INDIA_VIEWBOX.height}`}
        role="img"
        aria-label="Map of India showing GoAhead Mobility service states and cities"
        className="absolute inset-0 h-full w-full overflow-visible"
      >
        <defs>
          <linearGradient id="indiaStateFill" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#0b3f7d" />
            <stop offset="60%" stopColor="#062c5e" />
            <stop offset="100%" stopColor="#041f45" />
          </linearGradient>
          <filter id="indiaOuterGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
          <filter id="indiaDotGlow" x="-200%" y="-200%" width="500%" height="500%">
            <feGaussianBlur stdDeviation="2.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g aria-hidden="true" filter="url(#indiaOuterGlow)" opacity="0.75">
          {INDIA_STATES.map((s) => (
            <path key={s.name} d={s.d} fill="none" stroke="#1aa8ff" strokeWidth="5" />
          ))}
        </g>

        <g>
          {INDIA_STATES.map((s) => {
            const active = highlight && normalize(s.name) === highlight
            return (
              <path
                key={s.name}
                d={s.d}
                className="india-state"
                data-active={active ? 'true' : undefined}
                fill={active ? '#0d5fb3' : 'url(#indiaStateFill)'}
                stroke={active ? '#7fd8ff' : '#2b7fd0'}
                strokeOpacity={active ? 1 : 0.65}
                strokeWidth={active ? 1.2 : 0.6}
                strokeLinejoin="round"
              >
                <title>{s.name === 'Delhi' ? 'Delhi NCR' : s.name}</title>
              </path>
            )
          })}
        </g>

        <g fill="#2ec8ff" filter="url(#indiaDotGlow)" aria-hidden="true">
          {network.map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="1.9" className="india-network-dot" style={{ animationDelay: `${(i % 9) * 0.35}s` }} />
          ))}
        </g>
      </svg>

      {cities.map((city, index) => {
        const pos = cityPosition(city, [40 + (index % 4) * 8, 30 + Math.floor(index / 4) * 15])
        const active = activeCityName === city.name
        return (
          <button
            type="button"
            key={String(city.name || index)}
            onClick={() => onSelectCity(city)}
            aria-label={`Show ${city.name} service area`}
            aria-pressed={active}
            className="footprint-map-pin group absolute z-10 flex size-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
            style={{ left: `${pos.left}%`, top: `${pos.top}%` }}
          >
            <span className={`india-pin-pulse absolute inset-0 rounded-full bg-[#16c9ff]/35 ${active ? 'scale-150' : ''}`} />
            <span
              className={`relative size-2.5 rounded-full shadow-[0_0_12px_3px_rgba(22,201,255,.85)] transition-transform group-hover:scale-125 ${active ? 'bg-white ring-4 ring-cyan-300/40' : 'bg-[#18cbff]'}`}
            />
            <span
              className={`pointer-events-none absolute left-5 top-1/2 hidden -translate-y-1/2 whitespace-nowrap rounded-md bg-[#021a36]/95 px-2 py-1 text-xs font-semibold text-white ring-1 ring-cyan-300/30 transition-opacity md:block ${active ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100'}`}
            >
              {city.name}
            </span>
          </button>
        )
      })}
    </div>
  )
}
