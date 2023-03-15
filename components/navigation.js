import styles from "../styles/Navigation.module.css";

// function NavigationItem() {
//   return <li className={styles.navItem}>{props}</li>;
// }

function Navigation() {
  return (
    <nav>
      <p role="logo">Rodney Mandap</p>
      <ul className={styles.navItems}>
        <li>Certifications</li>
        <li>Skills</li>
      </ul>
    </nav>
  );
}

export default Navigation;
