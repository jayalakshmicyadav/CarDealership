import { useRef, useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  asyncUpdateProfile,
  asyncChangePassword,
  asyncDeleteAccount,
} from "../store/actions/appActions";
import {
  notifyError,
  notifySuccess,
  notifyPendingPromise,
  notifySuccessPromise,
  notifyErrorPromise,
} from "../utils/Toast";
import {
  Camera, User, Mail, Phone, MapPin, Lock, Trash2,
  CheckCircle, AlertTriangle, Eye, EyeOff, Car, ShoppingBag, Heart, Star,
} from "lucide-react";
import DefaultAvatar from "/assets/image/Avatar.png";

// ─── Reusable labelled input ─────────────────────────────────────────
const Field = ({ label, icon: Icon, type = "text", value, onChange, placeholder, disabled, suffix }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <div className="relative">
      {Icon && (
        <Icon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full ${Icon ? "pl-9" : "pl-3"} ${suffix ? "pr-20" : "pr-3"} py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 transition-colors`}
      />
      {suffix && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">{suffix}</span>
      )}
    </div>
  </div>
);

// ─── Section wrapper ─────────────────────────────────────────────────
const Section = ({ title, subtitle, children, border = true }) => (
  <div className={`py-6 ${border ? "border-b border-gray-200" : ""}`}>
    <div className="mb-4">
      <h3 className="text-base font-semibold text-gray-900">{title}</h3>
      {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
    </div>
    {children}
  </div>
);

// ─── Stat card ───────────────────────────────────────────────────────
const Stat = ({ icon: Icon, label, value, color }) => (
  <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3">
    <div className={`p-2 rounded-lg ${color}`}>
      <Icon size={18} className="text-white" />
    </div>
    <div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────
const Profile = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, userType, allCars, myCars } = useSelector((s) => s.app);
  const fileRef = useRef(null);

  // ── Profile info state
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [userName, setUserName] = useState(user?.user_name || "");
  const [email, setEmail]       = useState(user?.email || "");
  const [phone, setPhone]       = useState(user?.phone || "");
  const [location, setLocation] = useState(user?.location || "");
  const [savingInfo, setSavingInfo] = useState(false);

  // ── Password state
  const [currentPw, setCurrentPw] = useState("");
  const [newPw,     setNewPw]     = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw, setShowPw]       = useState(false);
  const [savingPw, setSavingPw]   = useState(false);

  // ── Delete account state
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  // Sync if user changes in store
  useEffect(() => {
    if (user) {
      setUserName(user.user_name || "");
      setEmail(user.email || "");
      setPhone(user.phone || "");
      setLocation(user.location || "");
    }
  }, [user]);

  // ── Avatar select
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      notifyError("Image must be under 5 MB");
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  // ── Save profile info
  const handleSaveInfo = async () => {
    if (!userName.trim()) return notifyError("Username cannot be empty");
    setSavingInfo(true);
    const id = notifyPendingPromise("Saving profile…");
    const form = new FormData();
    form.append("user_name", userName.trim());
    form.append("email", email.trim());
    form.append("phone", phone);
    form.append("location", location.trim());
    if (avatarFile) form.append("avatar", avatarFile);

    const res = await dispatch(asyncUpdateProfile(form, userType));
    setSavingInfo(false);
    if (res === 200) {
      notifySuccessPromise(id, "Profile saved!");
      setAvatarFile(null);
    } else {
      notifyErrorPromise(id, res?.message || "Update failed");
    }
  };

  // ── Change password
  const handleChangePassword = async () => {
    if (!currentPw || !newPw || !confirmPw) return notifyError("Fill all password fields");
    if (newPw !== confirmPw) return notifyError("New passwords do not match");
    if (newPw.length < 6) return notifyError("Password must be at least 6 characters");
    setSavingPw(true);
    const id = notifyPendingPromise("Changing password…");
    const res = await dispatch(asyncChangePassword({ currentPassword: currentPw, newPassword: newPw }, userType));
    setSavingPw(false);
    if (res === 200) {
      notifySuccessPromise(id, "Password changed!");
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
    } else {
      notifyErrorPromise(id, res?.message || "Password change failed");
    }
  };

  // ── Delete account
  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") return;
    setDeleting(true);
    const id = notifyPendingPromise("Deleting account…");
    const res = await dispatch(asyncDeleteAccount(userType));
    setDeleting(false);
    if (res === 200) {
      notifySuccessPromise(id, "Account deleted");
      navigate("/");
    } else {
      notifyErrorPromise(id, res?.message || "Deletion failed");
    }
  };

  // ── Stats
  const isDealer = userType === "Dealer";
  const dealerStats = isDealer
    ? {
        total:   myCars?.length ?? 0,
        active:  myCars?.filter((c) => !c.sold).length ?? 0,
        sold:    myCars?.filter((c) => c.sold).length ?? 0,
        revenue: myCars
          ?.filter((c) => c.sold)
          .reduce((s, c) => s + (c.price || 0), 0) ?? 0,
      }
    : null;

  const buyerStats = !isDealer
    ? {
        purchased: allCars?.filter((c) => c.sold && c.buyer_id === user?._id).length ?? 0,
        watchlist: user?.watch_list?.length ?? 0,
        reviews:   user?.review?.length ?? 0,
        chats:     user?.chat?.length ?? 0,
      }
    : null;

  const currentAvatar = avatarPreview || user?.avatar?.url || DefaultAvatar;
  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-IN", { year: "numeric", month: "long" })
    : "—";

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <div className="max-w-3xl mx-auto px-4 pt-8">

        {/* ── Header card ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-6">
          <div className="h-24 bg-gradient-to-r from-blue-600 to-blue-400" />
          <div className="px-6 pb-6">
            {/* Avatar */}
            <div className="relative w-24 h-24 -mt-12 mb-3">
              <img
                src={currentAvatar}
                alt="avatar"
                className="w-24 h-24 rounded-full border-4 border-white shadow-md object-cover bg-gray-100"
                onError={(e) => { e.target.src = DefaultAvatar; }}
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-1.5 shadow-md transition-colors"
                title="Change photo"
              >
                <Camera size={14} />
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </div>

            <div className="flex items-start justify-between flex-wrap gap-2">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{user?.user_name}</h2>
                <p className="text-sm text-gray-500">{user?.email}</p>
                <span className="inline-block mt-1 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                  {userType}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1">Member since {memberSince}</p>
            </div>
          </div>
        </div>

        {/* ── Stats ── */}
        {isDealer ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <Stat icon={Car}     label="Listed"   value={dealerStats.total}   color="bg-blue-500" />
            <Stat icon={CheckCircle} label="Active" value={dealerStats.active} color="bg-green-500" />
            <Stat icon={ShoppingBag} label="Sold"  value={dealerStats.sold}   color="bg-purple-500" />
            <Stat icon={Star}    label="Revenue"
              value={dealerStats.revenue > 0 ? `₹${(dealerStats.revenue / 100000).toFixed(1)}L` : "₹0"}
              color="bg-amber-500" />
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <Stat icon={Car}        label="Purchased" value={buyerStats.purchased} color="bg-blue-500" />
            <Stat icon={Heart}      label="Watchlist" value={buyerStats.watchlist} color="bg-red-500" />
            <Stat icon={Star}       label="Reviews"   value={buyerStats.reviews}   color="bg-amber-500" />
            <Stat icon={ShoppingBag} label="Chats"    value={buyerStats.chats}     color="bg-purple-500" />
          </div>
        )}

        {/* ── Main form card ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 px-6">

          {/* Personal Information */}
          <Section title="Personal Information" subtitle="Update your name, contact details and location.">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field
                label="Username" icon={User}
                value={userName} onChange={(e) => setUserName(e.target.value)}
                placeholder="Your username"
              />
              <Field
                label="Email" icon={Mail} type="email"
                value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
              />
              <Field
                label="Phone" icon={Phone} type="tel"
                value={phone} onChange={(e) => setPhone(e.target.value)}
                placeholder="10-digit mobile number"
              />
              <Field
                label="Location" icon={MapPin}
                value={location} onChange={(e) => setLocation(e.target.value)}
                placeholder="City, State"
              />
            </div>
            {avatarFile && (
              <p className="text-xs text-blue-600 mt-3 flex items-center gap-1">
                <Camera size={12} /> New photo selected — will upload on save
              </p>
            )}
            <div className="flex justify-end mt-5">
              <button
                type="button"
                onClick={handleSaveInfo}
                disabled={savingInfo}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                {savingInfo ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </Section>

          {/* Change Password */}
          <Section title="Change Password" subtitle="Use a strong password you don't use elsewhere.">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showPw ? "text" : "password"}
                    value={currentPw}
                    onChange={(e) => setCurrentPw(e.target.value)}
                    placeholder="Current password"
                    className="w-full pl-9 pr-10 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <div />
              <Field
                label="New Password" icon={Lock}
                type={showPw ? "text" : "password"}
                value={newPw} onChange={(e) => setNewPw(e.target.value)}
                placeholder="At least 6 characters"
              />
              <Field
                label="Confirm New Password" icon={Lock}
                type={showPw ? "text" : "password"}
                value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)}
                placeholder="Repeat new password"
              />
            </div>
            {newPw && confirmPw && newPw !== confirmPw && (
              <p className="text-xs text-red-500 mt-2">Passwords do not match</p>
            )}
            <div className="flex justify-end mt-5">
              <button
                type="button"
                onClick={handleChangePassword}
                disabled={savingPw}
                className="px-6 py-2.5 bg-gray-900 hover:bg-gray-800 active:bg-black disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                {savingPw ? "Updating…" : "Update Password"}
              </button>
            </div>
          </Section>

          {/* Danger Zone */}
          <Section title="Danger Zone" subtitle="" border={false}>
            <div className="border border-red-200 bg-red-50 rounded-xl p-5">
              <div className="flex items-start gap-3 mb-4">
                <AlertTriangle size={20} className="text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-700">Delete your account permanently</p>
                  <p className="text-xs text-red-600 mt-1">
                    This will delete your account, all your data
                    {isDealer ? ", and all your car listings" : " and purchase history"}.
                    This action <strong>cannot be undone</strong>.
                  </p>
                </div>
              </div>
              <p className="text-xs text-gray-600 mb-2">
                Type <strong className="font-mono text-red-600">DELETE</strong> to confirm:
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value.toUpperCase())}
                  placeholder="Type DELETE"
                  className="flex-1 border border-red-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 font-mono"
                />
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirmText !== "DELETE" || deleting}
                  className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 active:bg-red-800 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  <Trash2 size={15} />
                  {deleting ? "Deleting…" : "Delete Account"}
                </button>
              </div>
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
};

export default Profile;
