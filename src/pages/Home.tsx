import { Link } from 'react-router-dom'
import Court from '../components/Court'
import { seatsForRotation } from '../logic/lineup'
import { REFERENCE } from '../logic/reference'
import { arrowsFromBase, tokensFromByPos } from '../logic/view'

const DEMO_ROTATION = 4

export default function Home() {
  const seats = seatsForRotation(DEMO_ROTATION)
  const at = REFERENCE[DEMO_ROTATION][0].at

  return (
    <section className="hero">
      <div className="hero-copy">
        <h1>
          Who's hiding Josh <span>(and Cynthia)</span>
        </h1>
        <p className="lede">
          Learn volleyball serve-receive rotations from first principles. Start with the handful of rules that decide
          where everyone is allowed to stand, then practice: you get a rotation, you drag the players, and the app tells
          you whether the formation is legal and whether the setter is hidden.
        </p>
        <div className="cta">
          <Link className="btn primary" to="/rules/1">
            Learn the rules
          </Link>
          <Link className="btn" to="/practice">
            Jump to practice
          </Link>
        </div>
        <ul className="legend">
          <li>
            <i className="dot setter" /> Setter
          </li>
          <li>
            <i className="dot front" /> Front-row player
          </li>
          <li>
            <i className="dot back" /> Back-row player
          </li>
        </ul>
      </div>
      <figure className="figure">
        <Court
          size="md"
          tokens={tokensFromByPos(seats, at)}
          arrows={arrowsFromBase(seats, at)}
          label="Example: a setter tucked behind the front-right hitter"
        />
        <figcaption>One way to hide a back-row setter: tucked behind the front-right hitter.</figcaption>
      </figure>
    </section>
  )
}
