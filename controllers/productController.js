const Product = require('../models/Product');
const User = require('../models/User');
const BrandProduct = require('../models/BrandProducts');
const axios = require("axios");
const { randomUUID } = require("crypto");
const { Octokit } = require("@octokit/rest");

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
const GITHUB_OWNER = process.env.GITHUB_OWNER;
const GITHUB_REPO = process.env.GITHUB_REPO;

// ==== GitHub helper ====
// ==== GitHub helper ====
async function pushImagesAndManifest(files, externalId) {
  const folderPath = `${externalId}`;
  const manifest = {
    images: []
  };

  const fileLinks = [];

  for (let i = 0; i < files.length; i++) {
    const ext = files[i].originalname.split('.').pop().toLowerCase();
    const fileName = `${i + 1}.${ext}`;
    const content = files[i].buffer.toString('base64');

    await octokit.repos.createOrUpdateFileContents({
      owner: GITHUB_OWNER,
      repo: GITHUB_REPO,
      path: `${folderPath}/${fileName}`,
      message: `Add ${fileName} for product ${externalId}`,
      content
    });

    manifest.images.push(fileName);


    const fileUrl = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/main/${folderPath}/${fileName}`;
    fileLinks.push(fileUrl);
  }

  // manifest.json
  await octokit.repos.createOrUpdateFileContents({
    owner: GITHUB_OWNER,
    repo: GITHUB_REPO,
    path: `${folderPath}/manifest.json`,
    message: `Add manifest.json for product ${externalId}`,
    content: Buffer.from(JSON.stringify(manifest, null, 2)).toString('base64')
  });

  return fileLinks;
}


async function getImagesFromGitHub(productId) {
  try {
    const manifestUrl = `https://raw.githubusercontent.com/Arm-yan-coder/product-images/main/${productId}/manifest.json`;
    const { data } = await axios.get(manifestUrl);

    if (!data || typeof data !== 'object') return [];
    return Object.values(data);
  } catch {
    return [];
  }
}

// ==== POST / ====
async function generateUniqueExternalId() {
  let externalId;
  let exists = true;

  while (exists) {
    externalId = Math.floor(1000000 + Math.random() * 9000000).toString(); 
    exists = await Product.findOne({ externalId }); 
  }

  return externalId;
}

// ==== POST / ====
exports.addProduct = async (req, res) => {
  const { title, price, category, colors, isNewProducts, isPopular, visible, description } = req.body;

  try {
    const externalId = await generateUniqueExternalId(); 


    const images = await pushImagesAndManifest(req.files, externalId);
    console.log(images, 'sasssssaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');


    const product = new Product({
      externalId,
      title,
      price,
      image: images,
      category,
      colors,
      isNewProducts,
      isPopular,
      visible,
      description
    });

    const savedProduct = await product.save();
    console.log('Saved product:', savedProduct);

    res.status(201).json(savedProduct);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};


exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find();


    const productsWithGitHubImages = await Promise.all(
      products.map(async (product) => {
        const images = await getImagesFromGitHub(product.externalId);

        if (images.length > 0) {
          product.image = images;
        }

        return product;
      })
    );

    res.json(productsWithGitHubImages);
  } catch (err) {
    // // console.error("Error", err);
    res.status(500).json({ message: 'Server error' });
  }
};


exports.addToFavorites = async (req, res) => {
  const { userId, productId } = req.body;
  try {
    const user = await User.findById(userId);
    if (!user.favorites.includes(productId)) {
      user.favorites.push(productId);
      await user.save();
    }
    res.json({ favorites: user.favorites });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};


exports.removeFromFavorites = async (req, res) => {
  const { userId, productId } = req.body;
  try {
    const user = await User.findById(userId);
    user.favorites = user.favorites.filter(id => id.toString() !== productId);
    await user.save();
    res.json({ favorites: user.favorites });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};


exports.addToCart = async (req, res) => {
  const userId = req.userId;
  const { productId, quantity, size, title, price, image } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const cartItem = user.cart.find(
      item => item.productId === productId && item.size === size
    );

    if (cartItem) {
      cartItem.quantity = quantity;
    } else {
      user.cart.push({
        productId,
        quantity,
        size,
        title,
        price,
        image
      });
    }
    await user.save();

    res.json({ cart: user.cart });
  } catch (error) {
    // // console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};


exports.removeFromCart = async (req, res) => {
  const userId = req.userId;
  const { cartItemId, size } = req.body;
  
  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.cart = user.cart.filter(
      item => !(item.productId === cartItemId && item.size === size)
    );

    await user.save();
    res.json({ cart: user.cart });
  } catch (error) {
    // // console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};


exports.getCart = async (req, res) => {
  try {
    const userId = req.user?._id || req.userId;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const cartWithProducts = user.cart.map(item => ({
      _id: item._id,
      productId: item.productId,
      size: item.size,
      quantity: item.quantity,
      title: item.title,
      price: item.price,
      image: item.image
    }));

    res.status(200).json(cartWithProducts);
  } catch (error) {
    // // console.error('Error fetching cart', error);
    res.status(500).json({ message: 'Server error' });
  }
};


exports.getBrandProducts = async (req, res) => {
  try {
    const products = await BrandProduct.find();
    res.json(products);
  } catch (err) {
    // // console.error(err);
    res.status(500).json({ message: 'Error fetching branded products' });
  }
};

exports.deleteProduct = async (req, res) => {
  const productId = req.params.id;  

  try {
    const product = await Product.findOne({ externalId: productId });
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const externalId = product.externalId;
    const folderPath = `${externalId}`;


    let images = [];
    try {
      const manifestUrl = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/main/${folderPath}/manifest.json`;
      const { data } = await axios.get(manifestUrl);
      images = data.images || [];
    } catch { console.log('No manifest found, skipping GitHub images deletion'); }

    try {
      const manifestContent = await octokit.repos.getContent({
        owner: GITHUB_OWNER,
        repo: GITHUB_REPO,
        path: `${folderPath}/manifest.json`
      });

      await octokit.repos.deleteFile({
        owner: GITHUB_OWNER,
        repo: GITHUB_REPO,
        path: `${folderPath}/manifest.json`,
        message: `Delete manifest for product ${externalId}`,
        sha: manifestContent.data.sha
      });
    } catch { console.log('Manifest already deleted or not found'); }

    for (const imageName of images) {
      try {
        const fileContent = await octokit.repos.getContent({
          owner: GITHUB_OWNER,
          repo: GITHUB_REPO,
          path: `${folderPath}/${imageName}`
        });

        await octokit.repos.deleteFile({
          owner: GITHUB_OWNER,
          repo: GITHUB_REPO,
          path: `${folderPath}/${imageName}`,
          message: `Delete ${imageName}`,
          sha: fileContent.data.sha,
          branch: "main"
        });
      } catch { console.log(`File ${imageName} already deleted or not found`); }
    }

    await product.deleteOne();

    await User.updateMany({}, { $pull: { cart: { productId: externalId } } });

    res.json({ message: "Product deleted successfully" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

