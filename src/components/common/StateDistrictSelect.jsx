import React, { useState, useEffect } from 'react';
import { getAllStates, getDistrictsByState, fetchStatesList } from '../../services/locationService';

/**
 * Reusable State and District Dropdown Combo Boxes with live API integration
 */
const StateDistrictSelect = ({
  stateValue = '',
  districtValue = '',
  onStateChange,
  onDistrictChange,
  stateName = 'state',
  districtName = 'city',
  stateLabel = 'State *',
  districtLabel = 'District / City *',
  stateError = '',
  districtError = '',
  disabled = false,
  className = ''
}) => {
  const [states, setStates] = useState(getAllStates());
  const [districts, setDistricts] = useState([]);
  const [loadingStates, setLoadingStates] = useState(false);

  useEffect(() => {
    const loadApiStates = async () => {
      try {
        setLoadingStates(true);
        const list = await fetchStatesList();
        if (list && list.length > 0) {
          setStates(list);
        }
      } catch (err) {
        console.warn('Error loading states in StateDistrictSelect:', err);
      } finally {
        setLoadingStates(false);
      }
    };
    loadApiStates();
  }, []);

  // Update district options whenever stateValue changes
  useEffect(() => {
    if (stateValue) {
      const dList = getDistrictsByState(stateValue);
      setDistricts(dList);
    } else {
      setDistricts([]);
    }
  }, [stateValue]);

  const handleStateSelect = (e) => {
    const selectedState = e.target.value;
    if (onStateChange) {
      onStateChange(e);
    }
    // If state changes and current district is not in new state's districts, reset district
    const newDistricts = getDistrictsByState(selectedState);
    if (onDistrictChange && (!selectedState || !newDistricts.includes(districtValue))) {
      onDistrictChange({
        target: {
          name: districtName,
          value: ''
        }
      });
    }
  };

  return (
    <>
      <div className={`form-group ${className}`}>
        <label>{stateLabel}</label>
        <select
          name={stateName}
          value={stateValue || ''}
          onChange={handleStateSelect}
          disabled={disabled || loadingStates}
          className={stateError ? 'input-error' : ''}
        >
          <option value="">-- Select State --</option>
          {states.map((st) => (
            <option key={st} value={st}>
              {st}
            </option>
          ))}
        </select>
        {stateError && <span className="field-error-hint error-text">{stateError}</span>}
      </div>

      <div className={`form-group ${className}`}>
        <label>{districtLabel}</label>
        <select
          name={districtName}
          value={districtValue || ''}
          onChange={onDistrictChange}
          disabled={disabled || !stateValue}
          className={districtError ? 'input-error' : ''}
        >
          <option value="">
            {stateValue ? '-- Select District / City --' : '-- First Select State --'}
          </option>
          {districts.map((dst) => (
            <option key={dst} value={dst}>
              {dst}
            </option>
          ))}
          {/* Fallback option if a pre-existing custom district is set */}
          {districtValue && !districts.includes(districtValue) && (
            <option value={districtValue}>{districtValue}</option>
          )}
        </select>
        {districtError && <span className="field-error-hint error-text">{districtError}</span>}
      </div>
    </>
  );
};

export default StateDistrictSelect;
