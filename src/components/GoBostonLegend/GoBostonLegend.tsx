import { useState, type ReactElement } from "react";
import "./GoBostonLegend.css";
import Modal from "react-modal";

type GoBostonLegendProps = {
  colorScale: string[];
  showLevelOfStress: boolean;
  setShowLevelOfStress: (v: boolean) => void;
  children: ReactElement;
};

export default function GoBostonLegend(props: GoBostonLegendProps) {
  // console.log('Legend')

  const [isModalOpen, setIsModalOpen] = useState(false);

  // console.log(colorScale)
  const { colorScale, showLevelOfStress, setShowLevelOfStress, children } =
    props;
  const future = { borderColor: colorScale[0] };
  const priority = { borderColor: colorScale[1] };

  // console.log(lts1)

  // const borderStyle = ({colorScale, index}) => {
  //   return ({borderColor: colorScale[index]})
  // }

  return (
    <div className="go-boston-legend go-boston-grid-container">
      <div className="go-boston-legend-header">
        <h2>Go Boston 2030</h2>
      </div>

      <div className="go-boston-legend-row" style={future}>
        <div className="go-boston-legend-text">
          <span>Future Improvements</span>
        </div>
      </div>

      <div className="go-boston-legend-row" style={priority}>
        <div className="go-boston-legend-text">
          <span>Priority Projects</span>
        </div>
      </div>
      <br />

      <div className="go-boston-legend-checkbox">
        <input
          type="checkbox"
          id="toggleLevelOfStress"
          name="toggleLevelOfStress"
          onChange={(e) => setShowLevelOfStress(e.target.checked)}
          checked={showLevelOfStress}
        />
        <label className="go-boston-legend-label" htmlFor="toggleLevelOfStress">
          Level of Stress
        </label>
      </div>

      <div className="go-boston-legend-checkbox">
        <input
          type="checkbox"
          id="toggleLevelOfStressBreakdown"
          name="toggleLevelOfStressBreakdown"
          onChange={(e) => setIsModalOpen(e.target.checked)}
          checked={isModalOpen}
        />
        <label
          className="go-boston-legend-label"
          htmlFor="toggleLevelOfStressBreakdown"
        >
          Level of Stress Breakdown
        </label>
      </div>
      <Modal
        isOpen={isModalOpen}
        contentLabel="Level of Stress Breakdown"
        className="Modal"
        overlayClassName="Overlay"
      >
        {children}
      </Modal>
    </div>
  );
}
