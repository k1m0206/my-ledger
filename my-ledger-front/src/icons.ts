import {
  Utensils, ShoppingBag, Shirt, Home, Smartphone, Sparkles, Droplets,
  AppWindow, Building, Car, Gamepad2, Heart, Wifi, BookOpen, Briefcase,
  Dumbbell, Users, Gift, Baby, Dog, Plane, Palmtree, Wine, Ticket,
  Wallet, TrendingUp, Clock, BadgeDollarSign, Landmark, PiggyBank,
  HandCoins, CircleDollarSign, LucideIcon,
  Coffee, Cake, Pizza, Beef, ShoppingCart, Store, Tag, Receipt,
  Bus, Train, Bike, Fuel, MapPin, Music, Film, Camera, Tv,
  Scissors, Wrench, Paintbrush, Pill, Stethoscope,
  GraduationCap, Library, Laptop, Tablet, Monitor, Headphones,
  Watch, Glasses, Crown, Trophy, Cat, Fish, Bird,
  Flower, TreePine, Mountain, Star, Bell, Umbrella,
  Sofa, Armchair, Lamp, Fan, Thermometer
} from 'lucide-react';

export const ICON_OPTIONS: { key: string; label: string; icon: LucideIcon }[] = [
  // 餐饮美食
  { key: 'utensils', label: '餐饮', icon: Utensils },
  { key: 'coffee', label: '咖啡', icon: Coffee },
  { key: 'cake', label: '甜品', icon: Cake },
  { key: 'pizza', label: '快餐', icon: Pizza },
  { key: 'beef', label: '肉类', icon: Beef },

  // 购物消费
  { key: 'shopping-bag', label: '购物', icon: ShoppingBag },
  { key: 'shopping-cart', label: '超市', icon: ShoppingCart },
  { key: 'store', label: '商店', icon: Store },
  { key: 'tag', label: '标签', icon: Tag },
  { key: 'receipt', label: '小票', icon: Receipt },

  // 服饰打扮
  { key: 'shirt', label: '服饰', icon: Shirt },
  { key: 'watch', label: '手表', icon: Watch },
  { key: 'glasses', label: '眼镜', icon: Glasses },
  { key: 'crown', label: '饰品', icon: Crown },
  { key: 'scissors', label: '理发', icon: Scissors },

  // 居家生活
  { key: 'home', label: '日用', icon: Home },
  { key: 'sofa', label: '家具', icon: Sofa },
  { key: 'armchair', label: '座椅', icon: Armchair },
  { key: 'lamp', label: '灯具', icon: Lamp },
  { key: 'fan', label: '家电', icon: Fan },

  // 数码科技
  { key: 'smartphone', label: '手机', icon: Smartphone },
  { key: 'laptop', label: '电脑', icon: Laptop },
  { key: 'tablet', label: '平板', icon: Tablet },
  { key: 'monitor', label: '显示器', icon: Monitor },
  { key: 'headphones', label: '耳机', icon: Headphones },
  { key: 'app-window', label: '软件', icon: AppWindow },

  // 美容护肤
  { key: 'sparkles', label: '美妆', icon: Sparkles },
  { key: 'droplets', label: '护肤', icon: Droplets },

  // 住房建筑
  { key: 'building', label: '房租', icon: Building },
  { key: 'landmark', label: '房贷', icon: Landmark },

  // 交通出行
  { key: 'car', label: '汽车', icon: Car },
  { key: 'bus', label: '公交', icon: Bus },
  { key: 'train', label: '地铁', icon: Train },
  { key: 'bike', label: '骑行', icon: Bike },
  { key: 'fuel', label: '加油', icon: Fuel },
  { key: 'map-pin', label: '停车', icon: MapPin },

  // 娱乐休闲
  { key: 'gamepad-2', label: '游戏', icon: Gamepad2 },
  { key: 'music', label: '音乐', icon: Music },
  { key: 'film', label: '影视', icon: Film },
  { key: 'camera', label: '摄影', icon: Camera },
  { key: 'tv', label: '电视', icon: Tv },

  // 医疗健康
  { key: 'heart', label: '健康', icon: Heart },
  { key: 'pill', label: '药品', icon: Pill },
  { key: 'stethoscope', label: '看病', icon: Stethoscope },
  { key: 'thermometer', label: '体温', icon: Thermometer },

  // 通讯网络
  { key: 'wifi', label: '网络', icon: Wifi },

  // 学习教育
  { key: 'book-open', label: '书籍', icon: BookOpen },
  { key: 'graduation-cap', label: '教育', icon: GraduationCap },
  { key: 'library', label: '培训', icon: Library },

  // 工作办公
  { key: 'briefcase', label: '工作', icon: Briefcase },
  { key: 'wrench', label: '维修', icon: Wrench },
  { key: 'paintbrush', label: '装修', icon: Paintbrush },

  // 运动健身
  { key: 'dumbbell', label: '健身', icon: Dumbbell },
  { key: 'trophy', label: '赛事', icon: Trophy },

  // 社交人情
  { key: 'users', label: '社交', icon: Users },
  { key: 'gift', label: '礼物', icon: Gift },
  { key: 'hand-coins', label: '红包', icon: HandCoins },
  { key: 'bell', label: '通知', icon: Bell },

  // 家庭育儿
  { key: 'baby', label: '育儿', icon: Baby },
  { key: 'umbrella', label: '雨伞', icon: Umbrella },

  // 宠物
  { key: 'dog', label: '宠物', icon: Dog },
  { key: 'cat', label: '猫咪', icon: Cat },
  { key: 'fish', label: '鱼类', icon: Fish },
  { key: 'bird', label: '鸟类', icon: Bird },

  // 旅行度假
  { key: 'plane', label: '飞机', icon: Plane },
  { key: 'palmtree', label: '度假', icon: Palmtree },
  { key: 'mountain', label: '登山', icon: Mountain },
  { key: 'flower', label: '花卉', icon: Flower },
  { key: 'tree-pine', label: '户外', icon: TreePine },

  // 烟酒
  { key: 'wine', label: '烟酒', icon: Wine },

  // 票券
  { key: 'ticket', label: '票券', icon: Ticket },

  // 收入相关
  { key: 'wallet', label: '工资', icon: Wallet },
  { key: 'trending-up', label: '投资', icon: TrendingUp },
  { key: 'clock', label: '加班', icon: Clock },
  { key: 'badge-dollar-sign', label: '退税', icon: BadgeDollarSign },
  { key: 'piggy-bank', label: '储蓄', icon: PiggyBank },
  { key: 'star', label: '奖金', icon: Star },

  // 其他
  { key: 'circle-dollar-sign', label: '其他', icon: CircleDollarSign },
];

export const ICON_COMPONENTS: Record<string, LucideIcon> = Object.fromEntries(
  ICON_OPTIONS.map(option => [option.key, option.icon])
);

export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  // 支出
  '餐饮': Utensils,
  '购物': ShoppingBag,
  '服饰': Shirt,
  '日用': Home,
  '数码': Smartphone,
  '美妆': Sparkles,
  '护肤': Droplets,
  '应用软件': AppWindow,
  '住房': Building,
  '交通': Car,
  '娱乐': Gamepad2,
  '医疗': Heart,
  '通讯': Wifi,
  '汽车': Car,
  '学习': BookOpen,
  '办公': Briefcase,
  '运动': Dumbbell,
  '社交': Users,
  '人情': Gift,
  '育儿': Baby,
  '宠物': Dog,
  '旅行': Plane,
  '度假': Palmtree,
  '烟酒': Wine,
  '彩票': Ticket,
  // 收入
  '工资': Wallet,
  '奖金': TrendingUp,
  '加班': Clock,
  '福利': Gift,
  '公积金': Landmark,
  '红包': HandCoins,
  '兼职': Briefcase,
  '副业': PiggyBank,
  '退税': BadgeDollarSign,
  '投资': TrendingUp,
  '意外收入': CircleDollarSign,
  '其他': CircleDollarSign,
};

export function getCategoryIcon(category: string, iconKey?: string): LucideIcon {
  if (iconKey && ICON_COMPONENTS[iconKey]) return ICON_COMPONENTS[iconKey];
  return CATEGORY_ICONS[category] || CircleDollarSign;
}
