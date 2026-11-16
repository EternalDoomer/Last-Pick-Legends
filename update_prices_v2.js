import fs from 'fs';
import path from 'path';

const filePath = path.resolve('src/data/players.json');
const players = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const updated = players.map(p => {
  // Новая формула: базовый рост + резкий скачок после 80 рейтинга
  let price = (p.rating - 60) * 9 + Math.pow(Math.max(0, p.rating - 80), 2) * 3;
  // Округляем до десятков для красоты
  price = Math.round(price / 10) * 10;
  
  return { ...p, price };
});

fs.writeFileSync(filePath, JSON.stringify(updated, null, 2));
console.log('✅ Новые цены успешно рассчитаны!');