import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";
import { exchangeProductFormElements } from "@/config";
import useTimeLeft from "@/hooks/useTimeLeft";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ProductImageUpload from "@/components/admin-view/image-upload";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BookOpen, Clock, MessageCircle, RefreshCw, ArrowRight, Loader2, CheckCircle2, XCircle } from "lucide-react";
import api from "@/api/axios";
import ShoppingHeader from "./header";
import { useChat } from "@/components/chat/ChatContext";

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
  const [bidSubmitted, setBidSubmitted] = useState(false);
  const [bidError, setBidError] = useState(false);
  const [exchangeError, setExchangeError] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const userEmail = useSelector((state) => state.auth.user?.email);
  const { user } = useSelector((state) => state.auth);
  const timeLeft = useTimeLeft(productDetails?.endTime);
  const isCurrentUserSeller = user?.email === productDetails?.sellerEmail;
  const isBiddingEnded = timeLeft === "Bidding Ended";

  const [isStartingChat, setIsStartingChat] = useState(false);

  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        const response = await api.get(`/shop/products/get/${id}`);
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
    if (isNaN(parsedBid)) {
      setErrorMessage("Please enter a valid number");
      return;
    }
    
    if (parsedBid <= productDetails?.currentBid) {
      setErrorMessage("Your bid must be higher than the current bid");
      return;
    }

    if (parsedBid < productDetails?.minBid) {
      setErrorMessage(`Your bid must be at least Rs. ${productDetails?.minBid}`);
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

      setBidAmount("");
      setErrorMessage("");
      setBidSubmitted(true);
    } catch (error) {
      console.error("Error placing bid:", error);
      setErrorMessage(error.response?.data?.message || "Failed to place bid");
      setBidError(true);
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
    } catch (error) {
      console.error("Exchange error:", error);
      setExchangeError(true);
    }
  };

  const handleChatWithSeller = async () => {
    if (!user) {
      toast.error("Please login to chat with the seller");
      navigate("/auth/login");
      return;
    }

    if (!productDetails?.sellerEmail) {
      toast.error("Seller information not available");
      return;
    }

    setIsStartingChat(true);
    try {
      console.log("Initiating chat with:", productDetails.sellerEmail);
      const response = await api.post('/chat/initiate', {
        email: productDetails.sellerEmail
      }, { withCredentials: true });
      
      console.log("Chat initiation response:", response.data);
      
      if (response.data?.chat?._id) {
        navigate(`/chat/${response.data.chat._id}`);
      } else if (response.data?._id) {
        navigate(`/chat/${response.data._id}`);
      } else {
        throw new Error("Invalid chat response format");
      }
    } catch (error) {
      console.error("Chat initiation error:", error);
      toast.error(error.response?.data?.message || 
                error.message || 
                "Failed to start chat with seller");
    } finally {
      setIsStartingChat(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-teal-600" />
          <p className="text-gray-600">Loading book details...</p>
        </div>
      </div>
    );
  }

  if (!productDetails) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="text-center">
          <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Product Not Found</h2>
          <p className="text-gray-600 mb-4">The book you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => navigate("/shop/home")} className="bg-teal-600 hover:bg-teal-700">
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ShoppingHeader />

      {/* Main content with improved spacing */}
      <main className="pt-16 md:pt-20 pb-20 md:pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            
            {/* Book Image Section */}
            <div className="order-2 lg:order-1">
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                {productDetails?.image ? (
                  <div className="aspect-[3/4] relative">
                    <img
                      src={productDetails.image}
                      alt={productDetails.title || "Book cover"}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = "/placeholder-book.jpg";
                      }}
                    />
                  </div>
                ) : (
                  <div className="aspect-[3/4] flex items-center justify-center bg-gray-100">
                    <BookOpen className="h-24 w-24 text-gray-300" />
                  </div>
                )}
              </div>
            </div>

            {/* Book Details Section */}
            <div className="order-1 lg:order-2 space-y-6">
              {/* Header */}
              <div className="space-y-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">
                    {productDetails.title}
                  </h1>
                  <p className="text-lg text-gray-600 mt-2">
                    by {productDetails.author}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="font-medium">Seller:</span>
                    <span>{productDetails.seller}</span>
                  </div>
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

              {/* Book Information */}
              <div className="bg-white rounded-lg p-6 shadow-sm border">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Book Details</h3>
                
                <div className="space-y-4">
                  <div>
                    <p className="text-gray-700 leading-relaxed">
                      {productDetails.description}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t">
                    <div>
                      <span className="text-sm font-medium text-gray-500">ISBN</span>
                      <p className="text-gray-900">{productDetails.isbn}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Publisher</span>
                      <p className="text-gray-900">{productDetails.publisher}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Publication Date</span>
                      <p className="text-gray-900">{productDetails.publicationDate}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Edition</span>
                      <p className="text-gray-900">{productDetails.edition}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bidding Section */}
              <div className="bg-gradient-to-r from-teal-50 to-blue-50 rounded-lg p-6 border border-teal-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Bidding Information</h3>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="text-center">
                    <span className="text-sm font-medium text-gray-600">Starting Bid</span>
                    <p className="text-2xl font-bold text-teal-700">Rs. {productDetails.minBid}</p>
                  </div>
                  <div className="text-center">
                    <span className="text-sm font-medium text-gray-600">Current Bid</span>
                    <p className="text-2xl font-bold text-teal-700">Rs. {productDetails.currentBid}</p>
                  </div>
                </div>

                {!isCurrentUserSeller && !isBiddingEnded && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="bid-amount" className="text-sm font-medium text-gray-700">
                        Place Your Bid (Rs.)
                      </Label>
                      <Input
                        id="bid-amount"
                        type="number"
                        value={bidAmount}
                        onChange={(e) => setBidAmount(e.target.value)}
                        placeholder="Enter your bid amount..."
                        min={productDetails.minBid}
                        step="0.01"
                        className="border-gray-300 focus:border-teal-500 focus:ring-teal-500"
                      />
                      {errorMessage && (
                        <p className="text-red-500 text-sm">{errorMessage}</p>
                      )}
                    </div>
                    <Button 
                      onClick={handleSubmitBid} 
                      className="w-full bg-teal-600 hover:bg-teal-700 text-white font-medium"
                    >
                      Submit Bid
                    </Button>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                {isCurrentUserSeller ? (
                  <Button
                    onClick={() => navigate("/shop/uploads")}
                    className="bg-teal-600 hover:bg-teal-700 text-white font-medium"
                  >
                    View My Listings
                  </Button>
                ) : (
                  <>
                    <Button
                      onClick={handleChatWithSeller}
                      className="bg-green-600 hover:bg-green-700 text-white font-medium"
                      disabled={isBiddingEnded || isStartingChat}
                    >
                      {isStartingChat ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Starting chat...
                        </>
                      ) : (
                        <>
                          <MessageCircle className="mr-2 h-4 w-4" />
                          Message Seller
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => setIsExchangeSidebarOpen(true)}
                      variant="outline"
                      className="border-purple-600 text-purple-600 hover:bg-purple-50 font-medium"
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

      {/* Bid Success Dialog */}
      <Dialog open={bidSubmitted} onOpenChange={setBidSubmitted}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center text-center p-6">
            <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Bid Placed Successfully!</h3>
            <p className="text-gray-600 mb-6">
              Your bid has been successfully placed.
            </p>
            <Button
              onClick={() => setBidSubmitted(false)}
              className="w-full bg-teal-600 hover:bg-teal-700"
            >
              Continue
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bid Error Dialog */}
      <Dialog open={bidError} onOpenChange={setBidError}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center text-center p-6">
            <XCircle className="h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Bid Failed</h3>
            <p className="text-gray-600 mb-6">
              {errorMessage || "There was an error placing your bid. Please try again."}
            </p>
            <Button
              onClick={() => setBidError(false)}
              className="w-full bg-red-600 hover:bg-red-700"
            >
              Try Again
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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

      {/* Exchange Error Dialog */}
      <Dialog open={exchangeError} onOpenChange={setExchangeError}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center text-center p-6">
            <XCircle className="h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Exchange Offer Failed</h3>
            <p className="text-gray-600 mb-6">
              There was an error submitting your exchange offer. Please try again.
            </p>
            <Button
              onClick={() => setExchangeError(false)}
              className="w-full bg-red-600 hover:bg-red-700"
            >
              Try Again
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}