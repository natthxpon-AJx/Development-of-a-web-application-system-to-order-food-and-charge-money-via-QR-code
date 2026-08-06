// import Cashier from "./pages/cashier";

// function App() {
//   return <Cashier />;
// }

// export default App;

// import Customer from "./pages/customer";

// function App() {
//   return <Customer />;
// }

// export default App;

// import Kitchen from "./pages/kitchen";

// function App() {
//   return <Kitchen />;
// }

// export default App;

// import Login from "./pages/login";

// function App() {
//   return <Login />;
// }

// export default App;

// import Owner from "./pages/owner";

// function App() {
//   return <Owner />;
// }

// export default App;

import { Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Customer from "./pages/Customer"; 
import Kitchen from "./pages/Kitchen";
import Cashier from "./pages/Cashier";
import Owner from "./pages/Owner";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/customer/:tableNumber" element={<Customer />} />
      <Route path="/kitchen" element={<Kitchen />} />
      <Route path="/cashier" element={<Cashier />} />
      <Route path="/owner" element={<Owner />} />
    </Routes>
  );
}

export default App;