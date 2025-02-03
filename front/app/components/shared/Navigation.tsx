'use client';
import { JSX } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import OnchainKitWallet from "../OnchainKitWallet";

const Navigation: React.FunctionComponent = (): JSX.Element => {

  const path = usePathname();

  return (
    <>
      {path !== '/' && (
        <nav className="navigation fixed top-0 left-1/2 transform -translate-x-1/2 bg-white bg-opacity-80 backdrop-blur-md rounded-full shadow-md p-4 z-50">
          <ul className="flex items-center justify-center space-x-8">
              <li><Link href="/dashboard" className={path === "/dashboard" ? "active" : ""}>Dashboard</Link></li>
              <li><Link href="/transactions" className={path === "/transactions" ? "active" : ""}>Transactions</Link></li>
              <li><Link href="/settings" className={path === "/settings" ? "active" : ""}>Settings</Link></li>
              <li><Link href="/faq" className={path === "/faq" ? "active" : ""}>FAQ</Link></li>
              <li><OnchainKitWallet /></li>
          </ul>
        </nav>
      )}
    </>
  )
}

export default Navigation;