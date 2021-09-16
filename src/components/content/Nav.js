import React from "react";
import { Link } from "gatsby";

const Nav = () => {
  return (
    <header>
      <Link className="logo" to="/">
        <img src="/images/C4-banner.png" alt="Code 423n4" />
      </Link>
      <nav>
        <Link to="/leaderboard">Leaderboard</Link>
        <Link to="/reports">Reports</Link>
        <a href="https://docs.code4rena.com">Docs</a>
      </nav>
    </header>
  );
};

export default Nav;
