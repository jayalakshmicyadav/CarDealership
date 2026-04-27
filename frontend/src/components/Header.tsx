import React from "react";
import DefaultAvatar from "/assets/image/Avatar.png";
import { Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { Badge } from "@mui/material";
import { Bell } from "lucide-react";

const Header = () => {
  const navigate = useNavigate();
  const { user, unreadChat } = useSelector((state: any) => state.app);

  return (
    <div className="flex items-center justify-between mb-4">
      <div>
        <h1 className="text-xl lg:text-[28px] font-medium text-[#2B3674] capitalize">
          Welcome Back, {user?.user_name} 👋
        </h1>
        <p className="text-sm text-gray-400">{user?.email}</p>
      </div>
      <div className="flex items-center gap-4 bg-white px-4 py-2.5 rounded-full shadow-lg">
        <Link to="/dealer/bargains">
          <Badge badgeContent={unreadChat?.length} color="secondary">
            <Bell size={22} className="text-gray-600 hover:text-blue-600 transition-colors" />
          </Badge>
        </Link>
        <Link to="/dealer/profile">
          <img
            src={user?.avatar?.url || DefaultAvatar}
            alt="Avatar"
            onError={(e: any) => { e.target.src = DefaultAvatar; }}
            className="w-9 h-9 rounded-full object-cover ring-2 ring-blue-200 hover:ring-blue-400 transition-all"
          />
        </Link>
      </div>
    </div>
  );
};

export default Header;
