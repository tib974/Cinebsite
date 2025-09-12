import {createSchema} from 'sanity'
import {schemaTypes} from './schemaTypes'

// Import our custom schemas
import product from './product'
import project from './project'
import simplePage from './simplePage'

export default createSchema({
  name: 'default',
  types: schemaTypes.concat([
    // Add our document types to the studio
    product,
    project,
    simplePage,
  ]),
})
