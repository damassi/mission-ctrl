import {createAction, handleActions} from 'redux-actions'
import {fromJS} from 'immutable'

export const SOURCE_CHANGED = 'ship-yard/foreman/SOURCE_CHANGED'

export const initialState = fromJS({})

export default handleActions({}, initialState)

export const sourceChanged = createAction(SOURCE_CHANGED)
