import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";
import { exchangeProductFormElements } from "@/config";
import useTimeLeft from "@/hooks/useTimeLeft";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import ProductImageUpload from "@/components/admin-view/image-upload";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BookOpen, Clock, MessageCircle, RefreshCw, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import api from "@/api/axios";

export default function BookDetailsPage() {
  const { id } = useParams();
  const [productDetails, setProductDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bidAmount, setBidAmount] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isExchangeSidebarOpen, setIsExchangeSidebarOpen] = useState(false);
  const [exchangeFormData, setExchangeFormData] = useState({});
  const [exchangeImageFile, setExchangeImageFile] = useState(null);
  const [exchangeUploadedImageUrl, setExchangeUploadedImageUrl] = useState("");
  const [exchangeImageLoadingState, setExchangeImageLoadingState] = useState(false);
  const [exchangeSubmitted, setExchangeSubmitted] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const userEmail = useSelector((state) => state.auth.user?.email);
  const { user } = useSelector((state) => state.auth);
  const timeLeft = useTimeLeft(productDetails?.endTime);
  const isCurrentUserSeller = user?.email === productDetails?.sellerEmail;
  const isBiddingEnded = timeLeft === "Bidding Ended";

useEffect(() => {
const fetchProductDetails = async () => {
  try {
    const response = await api.get(`/shop/products/get/${id}`);
    
    // Remove .data if you change backend to return raw product
    setProductDetails(response.data); 
    
  } catch (error) {
    console.error("Fetch error:", error);
    toast.error(error.response?.data?.message || "Product load failed");
    navigate("/shop/home");
  } finally {
    setLoading(false);
  }
};

  fetchProductDetails();
}, [id, navigate]);

  const handleSubmitBid = async () => {
    const parsedBid = Number.parseFloat(bidAmount);
    if (isNaN(parsedBid) || parsedBid <= productDetails?.currentBid || parsedBid < productDetails?.minBid) {
      setErrorMessage("Your bid must be higher than the current bid and meet the minimum bid requirement.");
      return;
    }

    try {
      const response = await api.post(`/shop/products/${productDetails?._id}/placeBid`, {
        bidAmount: parsedBid,
        bidderEmail: userEmail,
      });

      setProductDetails({
        ...productDetails,
        currentBid: response.data.currentBid,
        bidderEmail: response.data.bidderEmail,
      });

      toast.success("Bid placed successfully!");
      setBidAmount("");
      setErrorMessage("");
    } catch (error) {
      console.error("Error placing bid:", error);
      setErrorMessage(error.response?.data?.message || "Failed to place bid");
    }
  };

  const handleExchangeSubmit = async () => {
    const requiredFields = ["eTitle", "eAuthor", "eIsbn", "ePublisher", "ePublicationDate", "eEdition", "eDescription"];
    const missingFields = requiredFields.filter((field) => !exchangeFormData[field]);

    if (missingFields.length > 0) {
      toast.error(`Missing required fields: ${missingFields.join(", ")}`);
      return;
    }

    if (!exchangeUploadedImageUrl) {
      toast.error("Please upload an image of the book you're offering");
      return;
    }

    if (!user?.phone) {
      toast.error("Your phone number is missing. Please update your profile.");
      return;
    }

    try {
      await api.post("/shop/products/offerExchange", {
        productId: productDetails?._id,
        userEmail: user?.email,
        exchangeOffer: {
          ...exchangeFormData,
          eImage: exchangeUploadedImageUrl,
          eBuyerPhone: user.phone,
        },
      });

      setIsExchangeSidebarOpen(false);
      setExchangeFormData({});
      setExchangeImageFile(null);
      setExchangeUploadedImageUrl("");
      setExchangeSubmitted(true);
      toast.success("Exchange request sent!");
    } catch (error) {
      console.error("Exchange error:", error);
      toast.error(error.response?.data?.message || "Failed to submit exchange");
    }
  };

  const handleChatWithSeller = () => {
    const phoneNumber = productDetails?.sellerPhone;
    if (!phoneNumber) {
      toast.error("Seller's phone number is not available.");
      return;
    }
    const message = encodeURIComponent(`Hello, I'm interested in your book: ${productDetails?.title}`);
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;
    window.open(whatsappUrl, "_blank");
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (!productDetails) {
    return <div className="flex justify-center items-center h-screen">Product not found</div>;
  }

  return (
    <div className="min-h-screen bg-white">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Book Cover */}
          <div className="flex justify-center">
            <div className="w-full bg-gray-50 rounded-lg overflow-hidden shadow-lg">
              {productDetails?.image ? (
                <img
                  src={productDetails.image || "/placeholder-book.jpg"}
                  alt={productDetails.title || "Book image"}
                  className="w-full h-auto max-h-[600px] object-cover"
                  onError={(e) => {
                    e.target.src = "/placeholder-book.jpg";
                  }}
                />
              ) : (
                <div className="flex items-center justify-center h-96 bg-gray-100">
                  <BookOpen className="h-24 w-24 text-gray-300" />
                </div>
              )}
            </div>
          </div>

          {/* Book Details */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{productDetails.title}</h1>
              <div className="flex items-center gap-4 mb-4">
                <span className="text-gray-700">
                  <strong>Seller:</strong> {productDetails.seller}
                </span>
                <Badge
                  variant="outline"
                  className={`${
                    isBiddingEnded
                      ? "bg-red-50 text-red-600 border-red-200"
                      : "bg-green-50 text-green-600 border-green-200"
                  }`}
                >
                  <Clock className="h-3.5 w-3.5 mr-1" />
                  {timeLeft}
                </Badge>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <strong className="text-gray-900">Description:</strong>
                <p className="text-gray-700 mt-1">{productDetails.description}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <strong className="text-gray-900">Author:</strong>
                  <p className="text-gray-700">{productDetails.author}</p>
                </div>
                <div>
                  <strong className="text-gray-900">ISBN:</strong>
                  <p className="text-gray-700">{productDetails.isbn}</p>
                </div>
                <div>
                  <strong className="text-gray-900">Publisher:</strong>
                  <p className="text-gray-700">{productDetails.publisher}</p>
                </div>
                <div>
                  <strong className="text-gray-900">Publication Date:</strong>
                  <p className="text-gray-700">{productDetails.publicationDate}</p>
                </div>
                <div>
                  <strong className="text-gray-900">Edition:</strong>
                  <p className="text-gray-700">{productDetails.edition}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4">
              <div className="bg-teal-50 p-4 rounded-lg">
                <div className="flex justify-between">
                  <div>
                    <strong className="text-gray-900">Starting Bid:</strong>
                    <p className="text-xl font-bold text-teal-700">Rs. {productDetails.minBid}</p>
                  </div>
                  <div>
                    <strong className="text-gray-900">Current Bid:</strong>
                    <p className="text-xl font-bold text-teal-700">Rs. {productDetails.currentBid}</p>
                  </div>
                </div>
              </div>

              {!isCurrentUserSeller && !isBiddingEnded && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="bid-amount">Place Your Bid (Rs.)</Label>
                    <Input
                      id="bid-amount"
                      type="number"
                      value={bidAmount}
                      onChange={(e) => setBidAmount(e.target.value)}
                      placeholder="Enter your bid amount..."
                      min={productDetails.minBid}
                      step="0.01"
                    />
                    {errorMessage && <p className="text-red-500 text-sm">{errorMessage}</p>}
                  </div>
                  <Button onClick={handleSubmitBid} className="w-full bg-teal-600 hover:bg-teal-700">
                    Submit Bid
                  </Button>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              {isCurrentUserSeller ? (
                <Button
                  onClick={() => navigate("/shop/uploads")}
                  className="bg-teal-600 hover:bg-teal-700"
                >
                  View My Listings
                </Button>
              ) : (
                <>
                  <Button
                    onClick={handleChatWithSeller}
                    className="bg-green-600 hover:bg-green-700"
                    disabled={isBiddingEnded}
                  >
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Chat with Seller
                  </Button>
                  <Button
                    onClick={() => setIsExchangeSidebarOpen(true)}
                    variant="outline"
                    className="border-purple-600 text-purple-600 hover:bg-purple-50"
                    disabled={isBiddingEnded}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Offer Exchange
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Exchange Offer Sheet */}
<Sheet open={isExchangeSidebarOpen} onOpenChange={setIsExchangeSidebarOpen}>
  <SheetContent className="sm:max-w-md p-0">
    <div className="h-full overflow-y-auto px-6 py-4">
      <SheetHeader className="mb-6">
        <SheetTitle className="text-xl font-bold text-gray-900">
          Offer an Exchange
        </SheetTitle>
      </SheetHeader>

      <div className="space-y-6 pb-6">
        <div className="space-y-2">
          <Label>Book Image</Label>
          <ProductImageUpload
            imageFile={exchangeImageFile}
            setImageFile={setExchangeImageFile}
            uploadedImageUrl={exchangeUploadedImageUrl}
            setUploadedImageUrl={setExchangeUploadedImageUrl}
            setImageLoadingState={setExchangeImageLoadingState}
            imageLoadingState={exchangeImageLoadingState}
          />
        </div>

        {exchangeProductFormElements.map((field) => (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>{field.label}</Label>
            <Input
              id={field.name}
              type={field.type}
              name={field.name}
              placeholder={field.placeholder}
              onChange={(e) =>
                setExchangeFormData({
                  ...exchangeFormData,
                  [e.target.name]: e.target.value,
                })
              }
              value={exchangeFormData[field.name] || ""}
            />
          </div>
        ))}

        <Button
          onClick={handleExchangeSubmit}
          className="w-full bg-purple-600 hover:bg-purple-700"
          disabled={exchangeImageLoadingState}
        >
          {exchangeImageLoadingState ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            "Submit Exchange Offer"
          )}
        </Button>
      </div>
    </div>
  </SheetContent>
</Sheet>


      {/* Exchange Success Dialog */}
      <Dialog open={exchangeSubmitted} onOpenChange={setExchangeSubmitted}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center text-center p-6">
            <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Offer Sent Successfully!</h3>
            <p className="text-gray-600 mb-6">
              Your exchange offer has been sent to the seller. They'll contact you if interested.
            </p>
            <Button
              onClick={() => setExchangeSubmitted(false)}
              className="w-full bg-teal-600 hover:bg-teal-700"
            >
              OK
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}