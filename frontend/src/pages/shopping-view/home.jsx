import { Fragment, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import HeroImage from '../../assets/book2.jpg'
import bannerThree from '../../assets/book3.jpg'
import "@fontsource/inspiration"; 
import "@fontsource/inika"; 
import "@fontsource/nunito-sans"
import "@fontsource/julius-sans-one"
import { fetchAllUserProducts } from "@/store/shop/products-slice";
import ShoppingProductTile from "./product-tile";
import Footer from './footer'
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { BookOpen, Users, TrendingUp, ArrowRight } from "lucide-react";

function ShoppingHome() {
  const dispatch = useDispatch();
  const {productList} = useSelector(state=> state.shopProductsSlice)
  const navigate = useNavigate();

  useEffect(() => {
    dispatch(fetchAllUserProducts());
  }, [dispatch])
  
  console.log(productList, "productlist")

  return (
    <Fragment>
      {/* Hero Section */}
      <div className="relative w-full h-[80vh] overflow-hidden">
        <img
          src={HeroImage}
          alt="Book exchange banner"
          className="w-full h-full object-cover"
        />

        {/* Hero Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/40">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-white max-w-4xl text-center px-6">
              <h1 className="text-5xl md:text-6xl font-bold mb-6 font-nunito leading-tight">
                Swap Stories, Not Just Pages
              </h1>
              <p className="text-xl md:text-2xl mb-8 font-nunito text-gray-200 max-w-2xl mx-auto">
                Discover affordable books, bid or exchange with ease, and join a community of passionate readers.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-4 rounded-lg transition-all duration-300 transform hover:scale-105 text-lg shadow-lg"
                  onClick={() => navigate("/shop/uploads")}
                >
                  Upload Book
                </Button>
                <Button
                  variant="outline"
                  className="border-white text-white hover:bg-white hover:text-gray-900 font-semibold px-8 py-4 rounded-lg transition-all duration-300 transform hover:scale-105 text-lg"
                  onClick={() => navigate("/shop/listing")}
                >
                  Browse Books
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>



      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <div className="text-center p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-100">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2 font-julius text-gray-800">Book Exchange</h3>
              <p className="text-gray-600">Trade your books with other readers and discover new stories.</p>
            </div>
            <div className="text-center p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-100">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2 font-julius text-gray-800">Community</h3>
              <p className="text-gray-600">Join a community of passionate readers and book lovers.</p>
            </div>
            <div className="text-center p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-100">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2 font-julius text-gray-800">Affordable</h3>
              <p className="text-gray-600">Find books at great prices through bidding and exchanges.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Latest Books Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-julius mb-4">Latest Books</h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Discover the most recently uploaded books from our community
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
            {productList && productList.length > 0
              ? productList.slice(-3).map(productItem => (
                  <ShoppingProductTile key={productItem.id} product={productItem} />
                ))
              : (
                <div className="col-span-full text-center py-12">
                  <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">No books available yet.</p>
                  <p className="text-gray-400">Be the first to upload a book!</p>
                </div>
              )}
          </div>
          {productList && productList.length > 3 && (
            <div className="text-center mt-8">
              <Button
                onClick={() => navigate("/shop/listing")}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                View All Books
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* About Section */}
      <section className="py-16 bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="lg:w-1/2">
              <img 
                src={bannerThree} 
                alt="Book Community" 
                className="w-full max-w-md mx-auto rounded-lg shadow-2xl"
              />
            </div>
            <div className="lg:w-1/2 text-center lg:text-left">
              <h2 className="text-4xl font-julius mb-6 text-white">
                Join Our Book Community
              </h2>
              <p className="font-nunito text-lg text-blue-100 leading-relaxed mb-6">
                TradeABook is more than just a platform - it's a community of passionate readers who believe in the power of sharing knowledge. Whether you're looking to discover new authors, find rare editions, or simply connect with fellow book lovers, our platform provides the perfect space for meaningful book exchanges.
              </p>
              <p className="font-nunito text-lg text-blue-100 leading-relaxed mb-8">
                Our mission is to make reading accessible to everyone while fostering a sustainable approach to book ownership. Join thousands of readers who have already discovered the joy of book trading.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button
                  onClick={() => navigate("/shop/listing")}
                  className="bg-white hover:bg-gray-100 text-blue-900 font-semibold px-6 py-3 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  Start Trading
                </Button>
                <Button
                  variant="outline"
                  className="border-white text-white hover:bg-white hover:text-blue-900 font-semibold px-6 py-3 rounded-lg transition-all duration-300"
                >
                  Learn More
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </Fragment>
  );
}

export default ShoppingHome;