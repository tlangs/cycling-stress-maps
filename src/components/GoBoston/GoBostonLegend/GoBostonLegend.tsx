import "./GoBostonLegend.css";

type GoBostonLegendProps = {
  colorScale: string[];
  showLevelOfStress: boolean;
  setShowLevelOfStress: (v: boolean) => void;
};

export default function GoBostonLegend(props: GoBostonLegendProps) {
  // console.log('Legend')

  // console.log(colorScale)
  const { colorScale, showLevelOfStress, setShowLevelOfStress } = props;
  const existing = { borderColor: colorScale[0] };
  const future = { borderColor: colorScale[1] };
  const priority = { borderColor: colorScale[2] };

  // console.log(lts1)

  // const borderStyle = ({colorScale, index}) => {
  //   return ({borderColor: colorScale[index]})
  // }

  return (
    <div className="go-boston-legend go-boston-grid-container">
      <div className="go-boston-legend-header">
        <h2>Go Boston 2030</h2>
      </div>

      <div className="go-boston-legend-row" style={existing}>
        <div className="go-boston-legend-text">
          <span>Existing Network</span>
        </div>
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
    </div>
  );
}
