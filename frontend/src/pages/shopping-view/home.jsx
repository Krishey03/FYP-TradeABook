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
import { BookOpen, Users, TrendingUp, ArrowRight, Star, Award, Heart, Shield } from "lucide-react";

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
      <section className="relative h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img
            src={HeroImage}
            alt="Book exchange banner"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/50"></div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 text-center text-white max-w-5xl mx-auto px-6">
          <div className="mb-8">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-light mb-4 leading-tight tracking-wide">
              Discover Your Next
              <span className="block font-semibold mt-2">Great Read</span>
            </h1>
          </div>
          
          <p className="text-lg md:text-xl lg:text-2xl font-light mb-10 max-w-3xl mx-auto leading-relaxed text-gray-200">
            Where stories find new homes and readers discover their next adventure. 
            Join our community of passionate book lovers.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Button
              className="bg-white text-black hover:bg-gray-100 font-medium px-8 py-4 text-base rounded-md transition-all duration-300 transform hover:scale-105 shadow-lg"
              onClick={() => navigate("/shop/uploads")}
            >
              Upload Book
            </Button>
            <Button
              variant="outline"
              className="border-white text-black hover:bg-white hover:text-black font-medium px-8 py-4 text-base rounded-md transition-all duration-300 transform hover:scale-105"
              onClick={() => navigate("/shop/listing")}
            >
              Explore Books
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold mb-1">10K+</div>
              <div className="text-gray-300 text-xs uppercase tracking-wide">Books Traded</div>
            </div>
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold mb-1">5K+</div>
              <div className="text-gray-300 text-xs uppercase tracking-wide">Happy Readers</div>
            </div>
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold mb-1">100%</div>
              <div className="text-gray-300 text-xs uppercase tracking-wide">Secure Trading</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-light mb-4 text-gray-900">
              Why Choose
              <span className="block font-semibold">TradeABook</span>
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Experience the future of book trading with our innovative platform designed for passionate readers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center group">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-gray-200 transition-colors">
                <BookOpen className="w-8 h-8 text-gray-800" />
              </div>
              <h3 className="text-lg font-semibold mb-3 text-gray-900">Smart Exchange</h3>
              <p className="text-gray-600 leading-relaxed text-sm">
                Intelligent matching system connects you with the perfect book trades.
              </p>
            </div>

            <div className="text-center group">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-gray-200 transition-colors">
                <Users className="w-8 h-8 text-gray-800" />
              </div>
              <h3 className="text-lg font-semibold mb-3 text-gray-900">Global Community</h3>
              <p className="text-gray-600 leading-relaxed text-sm">
                Connect with readers worldwide and discover diverse literary perspectives.
              </p>
            </div>

            <div className="text-center group">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-gray-200 transition-colors">
                <TrendingUp className="w-8 h-8 text-gray-800" />
              </div>
              <h3 className="text-lg font-semibold mb-3 text-gray-900">Value Trading</h3>
              <p className="text-gray-600 leading-relaxed text-sm">
                Get maximum value for your books through our advanced bidding system.
              </p>
            </div>

            <div className="text-center group">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-gray-200 transition-colors">
                <Shield className="w-8 h-8 text-gray-800" />
              </div>
              <h3 className="text-lg font-semibold mb-3 text-gray-900">Secure Platform</h3>
              <p className="text-gray-600 leading-relaxed text-sm">
                Your safety is our priority with verified users and secure transactions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Latest Books Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-light mb-4 text-gray-900">
              Latest
              <span className="block font-semibold">Additions</span>
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Discover the most recently uploaded books from our passionate community of readers.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
            {productList && productList.length > 0
              ? productList.slice(-3).map(productItem => (
                  <ShoppingProductTile key={productItem.id} product={productItem} />
                ))
              : (
                <div className="col-span-full text-center py-12">
                  <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BookOpen className="w-10 h-10 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">No books available yet</h3>
                  <p className="text-gray-600 mb-6">Be the first to share your favorite reads with the community.</p>
                  <Button
                    onClick={() => navigate("/shop/uploads")}
                    className="bg-gray-900 hover:bg-black text-white font-medium px-6 py-3 rounded-md transition-all duration-300"
                  >
                    Upload Your First Book
                  </Button>
                </div>
              )}
          </div>

          {productList && productList.length > 3 && (
            <div className="text-center">
              <Button
                onClick={() => navigate("/shop/listing")}
                className="bg-gray-900 hover:bg-black text-white font-medium px-8 py-4 text-base rounded-md transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                Explore All Books
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-light mb-6">
                A Community
                <span className="block font-semibold">Built on Stories</span>
              </h2>
              <p className="text-lg text-gray-300 leading-relaxed mb-6">
                TradeABook is more than just a platform - it's a celebration of literature and human connection. 
                We believe every book has a story to tell, and every reader has a story to share.
              </p>
              <p className="text-lg text-gray-300 leading-relaxed mb-8">
                Our mission is to create a sustainable ecosystem where knowledge flows freely, 
                stories find new homes, and readers discover their next great adventure.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={() => navigate("/shop/listing")}
                  className="bg-white text-black hover:bg-gray-100 font-medium px-6 py-3 rounded-md transition-all duration-300"
                >
                  Join the Community
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate("/shop/about")}
                  className="border-white text-black hover:bg-white hover:text-black font-medium px-6 py-3 rounded-md transition-all duration-300"
                >
                  Learn More
                </Button>
              </div>
            </div>

            <div className="relative">
              <img 
                src={bannerThree} 
                alt="Book Community" 
                className="w-full h-80 object-cover rounded-lg shadow-2xl"
              />
              <div className="absolute -bottom-4 -left-4 bg-white text-black p-4 shadow-lg rounded-lg">
                <div className="flex items-center gap-1 mb-1">
                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                </div>
                <p className="text-xs font-medium">Trusted by my friends :)</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-light mb-4 text-gray-900">
              What Our
              <span className="block font-semibold">Readers Say</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 border border-gray-200 hover:border-gray-300 transition-colors rounded-lg">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-6 h-6 text-gray-600" />
              </div>
              <p className="text-gray-600 mb-4 italic text-sm">
                "TradeABook has completely transformed how I discover new authors. The community is amazing!"
              </p>
              <h4 className="font-semibold text-gray-900">Sarah Johnson</h4>
              <p className="text-xs text-gray-500">Avid Reader</p>
            </div>

            <div className="text-center p-6 border border-gray-200 hover:border-gray-300 transition-colors rounded-lg">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="w-6 h-6 text-gray-600" />
              </div>
              <p className="text-gray-600 mb-4 italic text-sm">
                "The bidding system is brilliant! I've found rare editions I never thought I'd own."
              </p>
              <h4 className="font-semibold text-gray-900">Michael Chen</h4>
              <p className="text-xs text-gray-500">Book Collector</p>
            </div>

            <div className="text-center p-6 border border-gray-200 hover:border-gray-300 transition-colors rounded-lg">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-6 h-6 text-gray-600" />
              </div>
              <p className="text-gray-600 mb-4 italic text-sm">
                "Finally, a platform that makes book trading simple and secure. Highly recommended!"
              </p>
              <h4 className="font-semibold text-gray-900">Emma Rodriguez</h4>
              <p className="text-xs text-gray-500">Literature Student</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </Fragment>
  );
}

export default ShoppingHome;