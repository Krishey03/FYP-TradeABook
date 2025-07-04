const { imageUploadUtil } = require("../../helpers/cloudinary")
const Product = require("../../models/Product")
const eProduct = require("../../models/Exchange")
const { uploadFromBuffer } = require("../../helpers/cloudinary")

const handleImageUpload = async(req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded"
      });
    }

    const file = req.file;
    const result = await uploadFromBuffer(file.buffer);
    
    // FIX: Return correct response structure
    res.json({
      success: true,
      url: result.secure_url, // Frontend expects 'url'
      publicId: result.public_id // Frontend expects 'publicId'
    });
  } catch(error) {
    console.log("Image upload error:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred during image upload",
      error: error.message
    });
  }
};

//add a new product
const addProduct = async (req, res) => {
    try {
        const { title, author, isbn, publisher, publicationDate, edition, description, image, minBid, seller, sellerEmail, sellerPhone  } = req.body;

        const endTime = new Date(Date.now() + 15 * 60 * 1000);

        const newlyCreatedProduct = new Product({
            title,
            author,
            isbn,
            publisher,
            publicationDate,
            edition,
            description,
            image,
            minBid,
            seller,
            sellerEmail,
            sellerPhone,
            currentBid: minBid,
            bidderEmail: "",
            winnerEmail: "",
            endTime
        });

        await newlyCreatedProduct.save();
        const io = req.app.get("io");
        io.emit("newProductAdded", newlyCreatedProduct);

        // Autoassign winner when the bidding ends
        setTimeout(async () => {
            const product = await Product.findById(newlyCreatedProduct._id);
            if (product && product.currentBid > product.minBid) {
                product.winnerEmail = product.bidderEmail;
                await product.save();
                console.log(`Bidding ended. Winner: ${product.winnerEmail}`);
            }
        }, 3 * 60 * 1000);

        res.status(201).json({
            success: true,
            data: newlyCreatedProduct
        });
    } catch (e) {
        console.log(e);
        res.status(500).json({
            success: false,
            message: "An error occurred!"
        });
    }
};

//fetch all products
const fetchAllProducts = async(req,res)=>{
    try{
        const listOfProducts = await Product.find({})
        res.status(200).json({
            success: true,
            data: listOfProducts
        })
    }catch(e){
        console.log(e)
        res.status(500).json({
            success: false,
            message: "An error occured!"
        })
    }
}

//edit a product
const editProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, author, isbn, publisher, publicationDate, edition, description, image, minBid, seller, sellerEmail, sellerPhone } = req.body;
        const findProduct = await Product.findById(id);

        if (!findProduct) {
            return res.status(404).json({
                success: false,
                message: "Product not found.",
            });
        }

        findProduct.title = title || findProduct.title;
        findProduct.author = author || findProduct.author;
        findProduct.isbn = isbn || findProduct.isbn;
        findProduct.publisher = publisher || findProduct.publisher;
        findProduct.publicationDate = publicationDate || findProduct.publicationDate;
        findProduct.edition = edition || findProduct.edition;
        findProduct.description = description || findProduct.description;
        findProduct.image = image || findProduct.image;
        findProduct.seller = seller || findProduct.seller;
        findProduct.sellerEmail = sellerEmail || findProduct.sellerEmail;
        findProduct.sellerPhone = sellerPhone || findProduct.sellerPhone;
        findProduct.minBid = minBid || findProduct.minBid;

        await findProduct.save();

        res.status(200).json({
            success: true,
            data: findProduct,
        });
    } catch (e) {
        console.log(e);
        res.status(500).json({
            success: false,
            message: "An error occurred while updating the product.",
        });
    }
};

const deleteProduct = async(req,res)=>{
    try{
        const{id} = req.params
        const product = await Product.findByIdAndDelete(id)
        if(!product) return res.status(404).json({
            success:false,
            message:"Product not found.",
        })

        res.status(200).json({
            success: true,
            message: "Product has been deleted!"
        })
    }catch(e){
        console.log(e)
        res.status(500).json({
            success: false,
            message: "An error occured!"
        })
    }
}

const getCartItems = async (req, res) => {
    try {
        const userEmail = req.user.email;

        const cartItems = await Product.find({ winnerEmail: userEmail });

        res.status(200).json({
            success: true,
            data: cartItems
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "An error occurred while fetching the cart items."
        });
    }
};

const getAllExchanges = async (req, res) => {
    console.log('GET /exchanges hit');
    try {
      const exchanges = await eProduct.find()
        .populate('productId', 'title author')
        .populate('paymentId', 'amount status');
      res.json(exchanges);
    } catch (error) {
      res.status(500).json({ message: 'Server Error' });
    }
  };
  
const deleteExchange = async (req, res) => {
    try {
      await eProduct.findByIdAndDelete(req.params.id);
      res.json({ message: 'Exchange deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Server Error' });
    }
  };

module.exports = { handleImageUpload, addProduct, editProduct, deleteProduct, fetchAllProducts, getCartItems, getAllExchanges, deleteExchange };
