// src/pages/AuthPage.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import SignInForm from "../components/auth/SignInForm";
import SignUpForm from "../components/auth/SignUpForm";
import { useAuthContext } from "../hooks/useAuth";
import "./css/LoginPage.css";

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const { isAuthenticated, user } = useAuthContext();
  const navigate = useNavigate();

  // 🔁 Nếu đã login thì chặn /auth
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === "restaurant") {
        navigate("/restaurant", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate]);

  // Khi login thành công từ form
  const handleSignInSuccess = (signedUser) => {
    const u = signedUser || user;
    if (u?.role === "restaurant") {
      navigate("/restaurant", { replace: true });
    } else {
      navigate("/", { replace: true });
    }
  };

  const handleSignUpSuccess = () => {
    // Đăng ký xong quay về tab Đăng nhập
    setIsSignUp(false);
  };

  return (
    <div className="auth-page">
      <div
        className={`container ${isSignUp ? "right-panel-active" : ""}`}
        id="auth-container"
      >
        {/* ===== FORM ĐĂNG KÝ ===== */}
        <div className="form-container sign-up">
          {isSignUp && (
            <>
              <div className="auth-header">
                <img
                  src="/logo.png" // nếu có logo thì đổi path
                  alt="FFD Logo"
                  className="auth-logo"
                />
                <h2 className="auth-title">Tạo tài khoản mới</h2>
                <p className="auth-subtitle">
                  Đăng ký để đặt món dễ dàng, lưu địa chỉ và theo dõi đơn hàng.
                </p>
              </div>
              <SignUpForm onSuccess={handleSignUpSuccess} />
            </>
          )}
        </div>

        {/* ===== FORM ĐĂNG NHẬP ===== */}
        <div className="form-container sign-in">
          {!isSignUp && (
            <>
              <div className="auth-header">
                {/* Có thể thêm logo nếu muốn */}
                {/* <img src="/logo.png" alt="FFD Logo" className="auth-logo" /> */}
                <h2 className="auth-title">Đăng nhập</h2>
                <p className="auth-subtitle">
                  Chào mừng bạn quay lại Healthy Bites! Hãy đăng nhập để tiếp
                  tục.
                </p>
              </div>
              <SignInForm onSuccess={handleSignInSuccess} />
            </>
          )}
        </div>

        {/* ===== PANEL BÊN TRÁI/VƯỢT QUA ===== */}
        <div className="toggle-container">
          <div className="toggle">
            {/* Panel bên trái (khi đang ở Sign Up) */}
            <div className="toggle-panel toggle-left">
              <h1>Chào mừng trở lại!</h1>
              <p>
                Nếu bạn đã có tài khoản, hãy đăng nhập để đặt món nhanh hơn.
              </p>
              <button
                className="hidden"
                type="button"
                onClick={() => setIsSignUp(false)}
                aria-pressed={!isSignUp}
              >
                Đăng nhập
              </button>
            </div>

            {/* Panel bên phải (khi đang ở Sign In) */}
            <div className="toggle-panel toggle-right">
              <h1>Xin chào!</h1>
              <p>Tạo tài khoản để nhận ưu đãi cho thành viên mới nhé.</p>
              <button
                className="hidden"
                type="button"
                onClick={() => setIsSignUp(true)}
                aria-pressed={isSignUp}
              >
                Đăng ký
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
