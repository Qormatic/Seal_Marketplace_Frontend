import { useEffect, useState } from "react";
import { useChain } from "react-moralis";
import { Menu, Dropdown, Button } from "antd";
import { DownOutlined } from "@ant-design/icons";
import { PolygonLogo, ETHLogo } from "./logos";
import {styles} from "./styles"

const items = [
  {
    key: "0x5", // key
    label: "Goerli", // value
    icon: <ETHLogo />,
  },
  {
    key: "0x13881",
    label: "Mumbai",
    icon: <PolygonLogo />,
  }
];

export default function Chains() {
  const { switchNetwork, chainId, chain, account } = useChain();
  const [selected, setSelected] = useState({});

  useEffect(() => {
    // if (!chainId) return null;
    const newSelected = items.find((item) => item.key === chainId); // find the object in menuItems that matches wallet's current chainId
    setSelected(newSelected); // make "selected" equal the current chainId
    console.log("current chainId: ", chainId);
  }, [chainId]);

  const handleMenuClick = (e) => {
    console.log("switch to: ", e.key);
    switchNetwork(e.key);
  };

  const menuProps = {
    items,
    onClick: handleMenuClick,
  };

  return (
    <div>
      <Dropdown menu={menuProps} trigger={["hover"]}> 
        <Button
          key={selected?.key}
          icon={selected?.icon}
          style={{ ...styles.button, ...styles.item }}
        >
          <span style={{ marginLeft: "5px" }}>{selected?.label}</span>
          <DownOutlined />
        </Button>
      </Dropdown>
    </div>
  );
}