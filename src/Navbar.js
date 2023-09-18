import { Link } from 'react-router-dom';

function Navbar(props) {
    return (
        <span className="span-container" >
            <div>21M.080 Web Audio Sandbox</div>
            <span className="span-container">
                {props.page !== "Home" &&
                    <Link to="/" className="text-button home-link" onClick={() => props.setPage('Home')}>
                        Home
                    </Link>
                }
                {props.page !== "TableOfContents" &&
                    <Link to="/TableOfContents" className="text-button" onClick={() => props.setPage('TableOfContents')}>
                        Table Of Contents
                    </Link>
                }
            </span>
        </span>
    );
}
export default Navbar;
