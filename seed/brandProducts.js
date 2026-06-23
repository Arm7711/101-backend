require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const BrandProducts = require('../models/BrandProducts');

const exploreProducts = [
  {
    title: 'Oversized Graphic T-Shirt',
    price: 22.000,
    image: ['/images/product-1.png', '/images/product-2.png', '/images/product-3.png'],
    colors: ['White', 'Black'],
    category: 'T-Shirts',
    isNewProducts: true,
    isPopular: true,
    visible: true,
    order: 1
  },
  {
    title: 'Minimalist Hoodie',
    price: 24.000,
    image: ['/images/product-2.png', '/images/product-12.png'],
    colors: ['Black', 'Gray'],
    category: 'Hoodies',
    isNewProducts: false,
    isPopular: true,
    visible: true,
    order: 1
  },
  {
    title: 'Cropped Zip Hoodie',
    price: 27.000,
    image: ['/images/product-8.png', '/images/product-7.png'],
    colors: ['Beige', 'Pink'],
    category: 'Hoodies',
    isNewProducts: true,
    isPopular: true,
    visible: true,
    order: 2
  },
  {
    title: 'Printed Tote Bag',
    price: 22.000,
    image: ['/images/product-5.png', '/images/product-10.png'],
    colors: ['White', 'Natural'],
    category: 'Accessories',
    isNewProducts: false,
    isPopular: false,
    visible: true,
    order: 2
  },
  {
    title: 'Basic Crew Neck T-Shirt',
    price: 24.500,
    image: ['/images/product-3.png', '/images/product-1.png'],
    colors: ['White', 'Gray', 'Green'],
    category: 'T-Shirts',
    isNewProducts: false,
    isPopular: false,
    visible: true,
    order: 2
  },
  {
    title: 'Basic Crew Neck T-Shirt 3',
    price: 24.500,
    image: ['/images/product-3.png', '/images/product-1.png'],
    colors: ['White', 'Gray', 'Green'],
    category: 'T-Shirts',
    isNewProducts: false,
    isPopular: false,
    visible: false,
    order: 0
  },
];

const seedProducts = async () => {
  try {
    await connectDB();
    await BrandProducts.deleteMany(); 
    await BrandProducts.insertMany(exploreProducts);
    console.log('Products added to BrandProducts collection');
    process.exit();
  } catch (err) {
    // console.error('Error adding item', err);
    process.exit(1);
  }
};

seedProducts();
