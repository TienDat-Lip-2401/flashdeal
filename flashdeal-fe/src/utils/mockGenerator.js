const SAMPLE_CATEGORIES = [
  { name: 'Điện Thoại & Smartphone', slug: 'dien-thoai-smartphone' },
  { name: 'Laptop & Máy Tính Bảng', slug: 'laptop-may-tinh-bang' },
  { name: 'Tai Nghe & Âm Thanh', slug: 'tai-nghe-am-thanh' },
  { name: 'Đồng Hồ Thông Minh', slug: 'dong-ho-thong-minh' },
  { name: 'Phụ Kiện Gaming', slug: 'phu-kien-gaming' },
  { name: 'Thiết Bị Nhà Thông Minh', slug: 'thiet-bi-nha-thong-minh' },
  { name: 'Máy Ảnh & Quay Phim', slug: 'may-anh-quay-phim' },
];

const SAMPLE_PRODUCTS = [
  {
    name: 'iPhone 16 Pro Max 256GB Titan Tự Nhiên',
    price: 34990000,
    stock: 50,
    description: 'Chip A18 Pro mạnh mẽ, camera 48MP Fusion, màn hình 6.9 inch 120Hz Super Retina XDR.',
    imageUrl: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600&auto=format&fit=crop&q=80',
  },
  {
    name: 'Samsung Galaxy S24 Ultra 5G 12GB/512GB',
    price: 29990000,
    stock: 80,
    description: 'Quyền năng Galaxy AI, khung viền Titan cao cấp, camera zoom 100x siêu sắc nét kèm bút S-Pen.',
    imageUrl: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=600&auto=format&fit=crop&q=80',
  },
  {
    name: 'MacBook Pro 14 M3 Max 36GB/1TB Space Black',
    price: 64990000,
    stock: 25,
    description: 'Hiệu năng đỉnh cao cho đồ họa chuyên nghiệp và lập trình viên, màn hình Liquid Retina XDR.',
    imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&auto=format&fit=crop&q=80',
  },
  {
    name: 'Tai nghe Sony WH-1000XM5 Chống Ồn Cao Cấp',
    price: 7990000,
    stock: 120,
    description: 'Công nghệ chống ồn hàng đầu thế giới với 8 micro và bộ xử lý V1 + QN1 tích hợp.',
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80',
  },
  {
    name: 'Apple Watch Ultra 2 49mm GPS + Cellular Dây Alpine',
    price: 21490000,
    stock: 40,
    description: 'Thiết kế Titan siêu bền bỉ, GPS tần số kép độ chính xác cực cao, pin sử dụng tới 72 giờ.',
    imageUrl: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=600&auto=format&fit=crop&q=80',
  },
  {
    name: 'Bàn phím cơ không dây Keychron Q1 Pro RGB QMK/VIA',
    price: 4890000,
    stock: 65,
    description: 'Full nhôm CNC, kết nối 3 chế độ Bluetooth 5.1/Type-C, hỗ trợ Hot-swap và custom âm thanh gõ.',
    imageUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&auto=format&fit=crop&q=80',
  },
  {
    name: 'Chuột Gaming Logitech G Pro X Superlight 2 Wireless',
    price: 3690000,
    stock: 90,
    description: 'Trọng lượng siêu nhẹ chỉ 60g, cảm biến HERO 2 độ phân giải 32.000 DPI, Polling Rate 4000Hz.',
    imageUrl: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=600&auto=format&fit=crop&q=80',
  },
];

const CAMPAIGN_TITLES = [
  'Đại Tiệc Flash Sale Siêu Bão Công Nghệ',
  'Giờ Vàng Săn Siêu Phẩm Công Nghệ Giảm 50%',
  'Flash Sale Đêm Khuya - Giá Sốc Đỉnh Điểm',
  'Mega Flash Sale Cuối Tuần - Giới Hạn 100 Suất',
  'Săn Deal Thần Tốc - Xả Kho Không Lợi Nhuận',
];

export const getRandomCategory = () => {
  const randomSuffix = Math.floor(Math.random() * 1000);
  const template = SAMPLE_CATEGORIES[Math.floor(Math.random() * SAMPLE_CATEGORIES.length)];
  return {
    name: `${template.name} #${randomSuffix}`,
    slug: `${template.slug}-${randomSuffix}`,
    parentId: null,
    displayOrder: Math.floor(Math.random() * 10) + 1,
  };
};

export const getRandomProduct = (categoryId = null) => {
  const randomSuffix = Math.floor(Math.random() * 900) + 100;
  const template = SAMPLE_PRODUCTS[Math.floor(Math.random() * SAMPLE_PRODUCTS.length)];
  const priceVariation = (Math.floor(Math.random() * 20) - 10) * 100000;
  const finalPrice = Math.max(100000, template.price + priceVariation);

  return {
    name: `${template.name} [V${randomSuffix}]`,
    slug: '',
    categoryId: categoryId || 1,
    originalPrice: finalPrice,
    totalStock: Math.floor(Math.random() * 200) + 10,
    description: template.description,
    imageUrl: template.imageUrl,
    status: 'ACTIVE',
  };
};

export const getRandomRegisterUser = () => {
  const randomId = Math.floor(Math.random() * 90000) + 10000;
  const names = ['Nguyễn Văn Nam', 'Trần Thị Mai', 'Lê Hoàng Long', 'Phạm Minh Đức', 'Hoàng Thu Trang', 'Đỗ Quang Hải'];
  const cities = ['Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ'];
  const randomName = names[Math.floor(Math.random() * names.length)];
  const randomCity = cities[Math.floor(Math.random() * cities.length)];

  return {
    email: `customer${randomId}@flashdeal.vn`,
    password: 'Password@123',
    fullName: `${randomName} (${randomId})`,
    phone: `09${Math.floor(Math.random() * 90000000 + 10000000)}`,
    address: `Số ${Math.floor(Math.random() * 200) + 1} Đường Giải Phóng, ${randomCity}`,
  };
};

export const getRandomCampaign = () => {
  const now = new Date();
  const startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 24 hours ago (guaranteed active)
  const endTime = new Date(now.getTime() + 48 * 60 * 60 * 1000); // 48 hours later

  const formatLocalISO = (d) => {
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  };

  const title = CAMPAIGN_TITLES[Math.floor(Math.random() * CAMPAIGN_TITLES.length)];
  const randomSuffix = Math.floor(Math.random() * 900) + 100;

  return {
    title: `${title} #${randomSuffix}`,
    startTime: formatLocalISO(startTime),
    endTime: formatLocalISO(endTime),
  };
};
