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
      <div className="relative w-full h-[600px] overflow-hidden">
        <img
          src={HeroImage}
          alt="Book exchange banner"
          className="w-full h-full object-cover"
        />

  {/* Top-center Overlay */}
        <div className="absolute inset-0 flex items-start justify-center bg-black/50 p-6">
          <div className="text-white max-w-2xl text-center mt-10">
            <h1 className="text-4xl font-bold mb-4 font-nunito">
              Swap Stories, Not Just Pages
            </h1>
            <p className="text-lg mb-6 font-nunito">
              Discover affordable books, bid or exchange with ease, and join a community of readers.
            </p>
          <Button
            className="bg-[#DEDCFF] hover:bg-[#BFB9FF] text-black font-semibold px-8 py-5 rounded-lg transition"
            onClick={() => navigate("/shop/uploads")} // change "/upload" to your desired route
          >
            Upload Book
          </Button>
          </div>
        </div>
      </div>



      <section className="py-12 flex justify-center">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-julius text-center mb-8">
            Available Books
          </h2>
          <div className="flex justify-center">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {productList && productList.length > 0
                ? productList.slice(0, 3).map(productItem => (
                    <ShoppingProductTile key={productItem.id} product={productItem} />
                  ))
                : <p className="text-center w-full">No products available.</p>}
            </div>
          </div>
        </div>
      </section>

      <section className="flex pb-[300px] items-center justify-center min-h-screen py-12">
        <div className="container mx-auto px-4 flex flex-col items-center">
          <h2 className="text-3xl font-julius text-center mb-8">
            Think of Something
          </h2>

          <div className="flex flex-col md:flex-row items-center md:items-center gap-6">
            <img 
              src={bannerThree} 
              alt="Banner Three" 
              className="w-[300px] h-auto shadow-md"
            />

            <p className="font-nunito text-xl max-w-lg text-center md:text-left">
              There are many variations of passages of Lorem Ipsum available, but the majority have suffered alteration in some form, by injected humour, or randomised words which dont look even slightly believable. If you are going to use a passage of Lorem Ipsum, you need to be sure there isnt anything embarrassing hidden in the middle of text. All the Lorem Ipsum generators on the Internet tend to repeat predefined chunks as necessary, making this the first true generator on the Internet. It uses a dictionary of over 200 Latin words, combined with a handful of model sentence structures, to generate Lorem Ipsum which looks reasonable. The generated Lorem Ipsum is therefore always free from repetition, injected humour, or non-characteristic words etc.
            </p>
          </div>
        </div>
      </section>
      <Footer />
    </Fragment>
  );
}

export default ShoppingHome;