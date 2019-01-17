const _ = require('lodash');

const {User} = require('./../models/users');
const {Product} = require('./../models/products');
const {Cart} = require('./../models/carts');

async function login (email, password) {
    let foundUser = await User.findByCredentials(email, password);
    if (!foundUser) {
        return null;
    }
    let token = await foundUser.generateAuthToken();
    return token;
}

async function checkCartExists (user) {
    if (!user.cart) {
        return false;
    } 
    return true;
}

async function createCart(user) {
    let cart = await new Cart();
    cart.save();
    return await User.findByIdAndUpdate(user._id, { $set: { cart: cart._id }}, {new: true});
}

async function getCartID(user) {
    return user.cart;
}

async function getCartProducts(cartId) {
    let cart = await Cart.findById(cartId);
    return cart.products;
}

async function getCart(cartId) {
    let allCartInfo = await Cart.findById(cartId);
    let cart = _.pick(allCartInfo, ['total', 'products']);
    return cart;
}

async function checkProductExistsInCart(cartId, sku) { 
    let exists = await Cart.findOne({_id: cartId, sku: sku});
    if (!exists) {
        return false;
    }
    return true;
}

async function addToCart(user, sku) {
    let cartExists = await checkCartExists(user);
    if (!cartExists) {
        user = await createCart(user);
    }
    let cartID = await getCartID(user);

    let product = await Product.findOne({sku: sku});
    let coreProductInfo = _.pick(product, ['title', 'sku']);

    let isInCart = await checkProductExistsInCart(cartID, sku);
    if(!isInCart) {
        coreProductInfo.quantity = 1;
        await Cart.findByIdAndUpdate(cartID, { $push: { products : coreProductInfo} });
    } else {
        await Cart.findOneAndUpdate({_id: cartID, "products.sku": sku },  { $inc: { "products.$.quantity" : 1}})
    }
    let productAdded = await Cart.findOneAndUpdate({_id: cartID, "products.sku": sku },  { $inc: { total : product.price}}, {new: true});
    return productAdded;
}

module.exports = {
    login,
    checkCartExists,
    getCartID,
    createCart,
    getCart,
    addToCart
}