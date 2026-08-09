import type { ReactElement, SVGProps } from 'react';
import * as Icons from './icons';

const map: Record<string, (p: SVGProps<SVGSVGElement>) => ReactElement> = {
  Landmark: Icons.Landmark,
  TrendingUp: Icons.TrendingUp,
  Plane: Icons.Plane,
  Cpu: Icons.Cpu,
  Shield: Icons.Shield,
  Train: Icons.Train,
  Award: Icons.Award,
  Home: Icons.Home,
  BadgeCheck: Icons.BadgeCheck,
  FileText: Icons.FileText,
  CreditCard: Icons.CreditCard,
  MapPin: Icons.MapPin,
  Scale: Icons.Scale,
  Handshake: Icons.Handshake,
  Leaf: Icons.Leaf,
  Building: Icons.Building,
  Users: Icons.Users,
  Clock: Icons.Clock,
  Ruler: Icons.Ruler,
  Star: Icons.Star,
  Sparkle: Icons.Sparkle,
  Check: Icons.Check,
  // Township amenities & location
  Road: Icons.Road,
  Droplet: Icons.Droplet,
  Zap: Icons.Zap,
  Flower: Icons.Flower,
  Trees: Icons.Trees,
  Dumbbell: Icons.Dumbbell,
  Waves: Icons.Waves,
  Trophy: Icons.Trophy,
  Camera: Icons.Camera,
  Lightbulb: Icons.Lightbulb,
  Car: Icons.Car,
  Dog: Icons.Dog,
  Temple: Icons.Temple,
  Fountain: Icons.Fountain,
  Gate: Icons.Gate,
  Yoga: Icons.Yoga,
  Wallet: Icons.Wallet,
  Percent: Icons.Percent,
  GraduationCap: Icons.GraduationCap,
  Hospital: Icons.Hospital,
  Bus: Icons.Bus,
  Route: Icons.Route,
  Rocket: Icons.Rocket,
  Toy: Icons.Toy,
  Utensils: Icons.Utensils,
  Bird: Icons.Bird,
};

export function Icon({ name, ...props }: { name: string } & SVGProps<SVGSVGElement>) {
  const Cmp = map[name] ?? Icons.Sparkle;
  return <Cmp {...props} />;
}
