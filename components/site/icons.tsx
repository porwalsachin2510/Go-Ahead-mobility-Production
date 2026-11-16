import {
  BedDouble,
  Briefcase,
  Building2,
  Bus,
  CalendarDays,
  Car,
  ChartColumn,
  CircleCheck,
  Clock,
  Cpu,
  Factory,
  Globe,
  Headset,
  HeartHandshake,
  Map,
  Plane,
  Receipt,
  Route,
  ShieldCheck,
  Users,
  type LucideIcon,
} from 'lucide-react'

const ICONS: Record<string, LucideIcon> = {
  building: Building2,
  bed: BedDouble,
  plane: Plane,
  car: Car,
  bus: Bus,
  users: Users,
  shield: ShieldCheck,
  route: Route,
  clock: Clock,
  chart: ChartColumn,
  globe: Globe,
  factory: Factory,
  calendar: CalendarDays,
  cpu: Cpu,
  headset: Headset,
  receipt: Receipt,
  map: Map,
  check: CircleCheck,
  briefcase: Briefcase,
  heart: HeartHandshake,
}

export function BlockIcon({ name, className }: { name?: string; className?: string }) {
  const Icon = ICONS[name ?? ''] ?? CircleCheck
  return <Icon aria-hidden className={className} />
}
