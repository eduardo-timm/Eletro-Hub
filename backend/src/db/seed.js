require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('./pool');

const products = [
  {
    name: 'Notebook UltraSlim X14',
    brand: 'Nexis',
    category: 'Notebooks',
    description: 'Notebook leve de 14", ideal para trabalho e estudo, com bateria de longa duracao.',
    price: 4299.9,
    stock_quantity: 12,
    image_url: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800',
    specs: { processador: 'Ryzen 7', ram: '16GB', armazenamento: '512GB SSD', tela: '14 polegadas' },
    destaque: true
  },
  {
    name: 'Smartphone Nova 5G',
    brand: 'Orion',
    category: 'Smartphones',
    description: 'Smartphone com tela AMOLED de 6.5", camera tripla de 108MP e carregamento rapido.',
    price: 2199.0,
    stock_quantity: 25,
    image_url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800',
    specs: { tela: '6.5" AMOLED', camera: '108MP', bateria: '5000mAh' },
    destaque: true
  },
  {
    name: 'Fone Bluetooth AirSound Pro',
    brand: 'Sonik',
    category: 'Audio',
    description: 'Fone de ouvido sem fio com cancelamento de ruido ativo e 30h de autonomia.',
    price: 349.9,
    stock_quantity: 40,
    image_url: 'https://images.unsplash.com/photo-1518444065439-e933c06ce9cd?w=800',
    specs: { autonomia: '30h', anc: true, conexao: 'Bluetooth 5.3' },
    destaque: false
  },
  {
    name: 'Smart TV 55" 4K QuantumView',
    brand: 'Vixon',
    category: 'TVs',
    description: 'Smart TV 4K com HDR10+, sistema operacional integrado e 3 entradas HDMI.',
    price: 2899.0,
    stock_quantity: 8,
    image_url: 'https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=800',
    specs: { resolucao: '4K UHD', tamanho: '55"', hdr: 'HDR10+' },
    destaque: true
  },
  {
    name: 'Smartwatch FitPulse 2',
    brand: 'Orion',
    category: 'Wearables',
    description: 'Relogio inteligente com monitor cardiaco, GPS integrado e resistencia a agua.',
    price: 599.0,
    stock_quantity: 30,
    image_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800',
    specs: { tela: 'AMOLED 1.4"', bateria: '7 dias', resistencia: '5ATM' },
    destaque: false
  },
  {
    name: 'Caixa de Som PartyBox Mini',
    brand: 'Sonik',
    category: 'Audio',
    description: 'Caixa de som portatil a prova d’agua com luzes LED e 12h de bateria.',
    price: 429.0,
    stock_quantity: 18,
    image_url: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800',
    specs: { potencia: '40W', bateria: '12h', resistencia: 'IPX6' },
    destaque: false
  },
  {
    name: 'Monitor Gamer UltraView 27"',
    brand: 'Nexis',
    category: 'Monitores',
    description: 'Monitor gamer 27" 165Hz, 1ms de resposta, ideal para jogos competitivos.',
    price: 1699.0,
    stock_quantity: 15,
    image_url: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800',
    specs: { taxa_atualizacao: '165Hz', resposta: '1ms', painel: 'IPS' },
    destaque: true
  },
  {
    name: 'Tablet AirPad 11',
    brand: 'Vixon',
    category: 'Tablets',
    description: 'Tablet de 11" com caneta incluida, ideal para estudo e criacao de conteudo.',
    price: 1899.0,
    stock_quantity: 10,
    image_url: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800',
    specs: { tela: '11 polegadas', armazenamento: '128GB', caneta: 'Inclusa' },
    destaque: false
  }
];

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const adminPass = await bcrypt.hash('admin123', 10);
    await client.query(
      `INSERT INTO admins (name, email, password_hash, role)
       VALUES ($1, $2, $3, 'admin')
       ON CONFLICT (email) DO NOTHING`,
      ['Administrador Geral', 'admin@eletrohub.com', adminPass]
    );

    const clientPass = await bcrypt.hash('cliente123', 10);
    const clientRes = await client.query(
      `INSERT INTO clients (name, email, password_hash, phone)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      ['Cliente Teste', 'cliente@teste.com', clientPass, '(11) 99999-0000']
    );
    const clientId = clientRes.rows[0].id;

    const productIds = [];
    for (const p of products) {
      const res = await client.query(
        `INSERT INTO products (name, brand, category, description, price, stock_quantity, image_url, specs, destaque)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         RETURNING id`,
        [p.name, p.brand, p.category, p.description, p.price, p.stock_quantity, p.image_url, p.specs, p.destaque]
      );
      productIds.push(res.rows[0].id);
    }

    await client.query(
      `INSERT INTO interactions (product_id, client_id, type, message, rating, status)
       VALUES ($1, $2, 'avaliacao', 'Produto excelente, superou minhas expectativas!', 5, 'respondido')`,
      [productIds[0], clientId]
    );
    await client.query(
      `INSERT INTO interactions (product_id, client_id, type, message, status)
       VALUES ($1, $2, 'proposta', 'Consigo um desconto para pagamento a vista?', 'pendente')`,
      [productIds[1], clientId]
    );

    await client.query('COMMIT');
    console.log('Seed concluido com sucesso.');
    console.log('Admin: admin@eletrohub.com / admin123');
    console.log('Cliente: cliente@teste.com / cliente123');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch((err) => {
  console.error('Erro no seed:', err);
  process.exit(1);
});
