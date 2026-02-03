# Tasks: Role-Based Layer Weights

## 1. Domain Layer - Core Types and Value Objects

### 1.1 Create LayerWeights type
- [ ] 1.1 Create LayerWeights type
  - Define interface with 6 layer weights (frontend, backend, database, cloud, devops, others)
  - Add validation that weights sum to 1.0 (±0.001 tolerance)
  - Add helper methods: `isValid()`, `getWeight(layer)`, `toJSON()`
  - **File**: `packages/backend/src/domain/JDSpecTypes.ts`

### 1.2 Create role constants and mappings
- [ ] 1.2 Create role constants and mappings
  - Define seniority levels enum: Junior, Mid, Senior, Lead, Staff
  - Define basic titles enum: Software Engineer, Backend Engineer, Frontend Developer, Full Stack Engineer, QA Automation Engineer, DevOps Engineer, Data Engineer, Mobile Developer
  - Define full stack modifiers enum: Balanced, Frontend Heavy, Backend Heavy
  - Create `ROLE_LAYER_WEIGHTS` constant with predefined weights for each basic title
  - **File**: `packages/backend/src/domain/RoleTypes.ts` (new file)

### 1.3 Create RoleService domain service
- [ ] 1.3 Create RoleService domain service
  - Implement `getDefaultLayerWeights(role: string): LayerWeights`
  - Implement `extractBasicTitle(role: string): string` (removes seniority prefix)
  - Implement `validateRole(role: string): boolean`
  - Implement `parseRole(role: string): { seniority: string, basicTitle: string, modifier?: string }`
  - Add unit tests for all methods
  - **File**: `packages/backend/src/domain/RoleService.ts` (new file)
  - **Test File**: `packages/backend/src/domain/RoleService.test.ts` (new file)

## 2. Domain Layer - Update Bid Entity

### 2.1 Add layerWeights field to Bid entity
- [ ] 2.1 Add layerWeights field to Bid entity
  - Add `layerWeights: LayerWeights` field to Bid class
  - Update constructor to accept layerWeights
  - Update `create()` method to use RoleService for default weights
  - Add `getLayerWeights()` getter
  - Add `getLayerWeight(layer: TechLayer)` method
  - Update `toJSON()` to include layerWeights
  - **File**: `packages/backend/src/domain/Bid.ts`

### 2.2 Update mainStacks to support weighted skills
- [ ] 2.2 Update mainStacks to support weighted skills
  - Define `SkillWeight` interface: `{ skill: string, weight: number }`
  - Change `mainStacks: string[]` to `mainStacks: LayerSkills` where `LayerSkills = { [layer]: SkillWeight[] }`
  - Add validation that mainStacks has all 6 required keys
  - Add validation that skill weights sum to 1.0 per layer (±0.001 tolerance)
  - Add `getSkillsForLayer(layer: TechLayer): SkillWeight[]` method
  - Add `getAllSkills(): string[]` method (flattens all layers, returns skill names only)
  - Add `validateSkillWeights(): boolean` method
  - Update unit tests
  - **File**: `packages/backend/src/domain/Bid.ts`

### 2.3 Add property-based tests for Bid with weighted skills
- [ ] 2.3 Add property-based tests for Bid with weighted skills
  - Test that layerWeights always sum to 1.0
  - Test that mainStacks has all 6 required keys
  - Test that each layer value is an array of SkillWeight objects
  - Test that skill weights sum to 1.0 per layer (or layer is empty)
  - Test that getSkillsForLayer returns correct layer
  - Test that role parsing works correctly
  - **File**: `packages/backend/src/domain/Bid.property.test.ts`

## 3. Domain Layer - Match Rate Calculator

### 3.1 Create WeightedMatchRateCalculator domain service
- [ ] 3.1 Create WeightedMatchRateCalculator domain service
  - Implement `calculate(currentBid: Bid, matchedBid: Bid): MatchResult`
  - Implement `calculateLayerScore(currentSkills: SkillWeight[], matchedSkills: SkillWeight[]): number`
    - Formula: Σ (currentWeight × matchedWeight) for matching skills
  - Implement `getMatchingSkills(current: SkillWeight[], matched: SkillWeight[]): string[]`
  - Implement `getMissingSkills(current: SkillWeight[], matched: SkillWeight[]): string[]`
  - Use case-insensitive skill name matching
  - Return overall match rate and layer breakdown
  - **File**: `packages/backend/src/domain/WeightedMatchRateCalculator.ts` (new file)

### 3.2 Add unit tests for WeightedMatchRateCalculator
- [ ] 3.2 Add unit tests for WeightedMatchRateCalculator
  - Test perfect match (same skills, same weights)
  - Test no match (disjoint skills)
  - Test partial match with weighted products
  - Test case-insensitive matching
  - Test empty layers
  - Test layer weight application
  - Test example from design doc (React: 0.5×0.7 = 0.35)
  - **File**: `packages/backend/src/domain/WeightedMatchRateCalculator.test.ts` (new file)

### 3.3 Add property-based tests for weighted match rate calculation
- [ ] 3.3 Add property-based tests for weighted match rate calculation
  - Property: Match rate is always between 0 and 1
  - Property: Perfect match (same bid) = 1.0
  - Property: If all skills match with weight 1.0, score = 1.0
  - Property: Disjoint skills = 0.0
  - Property: Match rate is not symmetric (A→B ≠ B→A in general)
  - Property: Layer score ≤ 1.0 (since weights sum to 1.0)
  - **File**: `packages/backend/src/domain/WeightedMatchRateCalculator.property.test.ts` (new file)

## 4. Application Layer - Use Cases

### 4.1 Update CreateBidUseCase
- [ ] 4.1 Update CreateBidUseCase
  - Accept `layerWeights?: LayerWeights` in input (optional)
  - If not provided, use RoleService to get default weights from role
  - Validate mainStacks is object with 6 required keys (frontend, backend, database, cloud, devops, others)
  - Validate each key maps to array of SkillWeight objects
  - Validate skill weights sum to 1.0 per layer (±0.001 tolerance) or layer is empty
  - Pass layerWeights to Bid.create()
  - Update unit tests
  - **File**: `packages/backend/src/application/CreateBidUseCase.ts`

### 4.2 Create CalculateBidMatchRateUseCase
- [ ] 4.2 Create CalculateBidMatchRateUseCase
  - Implement `execute(currentBidId: string): Promise<BidMatchRateResult[]>`
  - Fetch current bid
  - Fetch all other bids
  - Use WeightedMatchRateCalculator to calculate match rate for each
  - Sort results by match rate (descending)
  - Return array of match results with layer breakdown
  - **File**: `packages/backend/src/application/CalculateBidMatchRateUseCase.ts` (new file)

### 4.3 Add unit tests for CalculateBidMatchRateUseCase
- [ ] 4.3 Add unit tests for CalculateBidMatchRateUseCase
  - Test with multiple bids
  - Test sorting by match rate
  - Test layer breakdown is included
  - Test with empty bid list
  - **File**: `packages/backend/src/application/CalculateBidMatchRateUseCase.test.ts` (new file)

## 5. Infrastructure Layer - Persistence

### 5.1 Update MongoDB Bid schema
- [ ] 5.1 Update MongoDB Bid schema
  - Add `layerWeights` field to BidDocument interface
  - Update `toDocument()` to serialize layerWeights
  - Update `toDomain()` to deserialize layerWeights
  - Handle migration: if layerWeights missing, compute from role
  - **File**: `packages/backend/src/infrastructure/MongoDBBidRepository.ts`

### 5.2 Update InMemory Bid repository
- [ ] 5.2 Update InMemory Bid repository
  - Update to handle layerWeights field
  - Update to handle object mainStacks format
  - **File**: `packages/backend/src/infrastructure/InMemoryBidRepository.ts`

### 5.3 Create data migration script
- [ ] 5.3 Create data migration script
  - Script to migrate existing bids:
    - Convert flat mainStacks array to weighted object (all skills → "others" layer with equal weights)
    - Add layerWeights based on role
  - Add dry-run mode
  - Add rollback capability
  - **File**: `packages/backend/src/infrastructure/migrations/migrate-bids-to-layer-weights.ts` (new file)

## 6. Infrastructure Layer - API Controllers

### 6.1 Update BidController for weighted skills
- [ ] 6.1 Update BidController for weighted skills
  - Update POST /api/bids to accept weighted skills format
  - Accept optional layerWeights in request body
  - Validate mainStacks structure (object with 6 keys, each containing SkillWeight[])
  - Validate each skill has {skill: string, weight: number}
  - Validate skill weights sum to 1.0 per layer (±0.001 tolerance) or layer is empty
  - Validate layerWeights sum to 1.0 if provided
  - Return layerWeights in response
  - **File**: `packages/backend/src/infrastructure/BidController.ts`

### 6.2 Create BidMatchRateController
- [ ] 6.2 Create BidMatchRateController
  - Implement GET /api/bids/:id/match-rate
  - Call CalculateBidMatchRateUseCase
  - Return match rates with layer breakdown
  - Add error handling
  - **File**: `packages/backend/src/infrastructure/BidMatchRateController.ts` (new file)

### 6.3 Register BidMatchRateController in server
- [ ] 6.3 Register BidMatchRateController in server
  - Add route: `/api/bids/:id/match-rate`
  - Wire up dependencies in container
  - **File**: `packages/backend/src/infrastructure/server.ts`
  - **File**: `packages/backend/src/infrastructure/container.ts`

## 7. Frontend - Types and API Client

### 7.1 Update frontend types
- [x] 7.1 Update frontend types
  - Add SkillWeight interface: `{ skill: string, weight: number }`
  - Add LayerWeights interface
  - Add LayerSkills interface: `{ [layer]: SkillWeight[] }`
  - Update Bid type: mainStacks to LayerSkills, add layerWeights
  - Add BidMatchRateResult type
  - Add LayerMatchResult type
  - **File**: `packages/frontend/src/api/types.ts`

### 7.2 Update API client
- [x] 7.2 Update API client
  - Update createBid to accept weighted skills mainStacks and optional layerWeights
  - Add getBidMatchRate(bidId: string) method
  - **File**: `packages/frontend/src/api/client.ts`

## 8. Frontend - Role Selector Component

### 8.1 Create RoleSelector component
- [x] 8.1 Create RoleSelector component
  - Seniority dropdown (Junior, Mid, Senior, Lead, Staff)
  - Basic title dropdown (Software Engineer, Backend Engineer, etc.)
  - Full Stack modifier dropdown (shown only for Full Stack Engineer)
  - Display computed role string
  - Emit role string on change
  - **File**: `packages/frontend/src/components/RoleSelector.tsx` (new file)

### 8.2 Add tests for RoleSelector
- [ ] 8.2 Add tests for RoleSelector
  - Test role string composition
  - Test Full Stack modifier visibility
  - Test all dropdown options
  - **File**: `packages/frontend/src/components/RoleSelector.test.tsx` (new file)

## 9. Frontend - Layer Weights Editor Component

### 9.1 Create LayerWeightsEditor component
- [x] 9.1 Create LayerWeightsEditor component
  - Display 6 number inputs for layer weights
  - Show sum validation (must equal 1.0)
  - Show error if sum ≠ 1.0
  - Emit layerWeights on change
  - Accept initial weights as prop
  - Make it collapsible (Accordion)
  - **File**: `packages/frontend/src/components/LayerWeightsEditor.tsx` (new file)

### 9.2 Add tests for LayerWeightsEditor
- [ ] 9.2 Add tests for LayerWeightsEditor
  - Test weight validation
  - Test sum calculation
  - Test error display
  - **File**: `packages/frontend/src/components/LayerWeightsEditor.test.tsx` (new file)

## 10. Frontend - Update BidForm

### 10.1 Update BidForm to use RoleSelector
- [x] 10.1 Update BidForm to use RoleSelector
  - Replace role TextField with RoleSelector component
  - Fetch default layer weights when role changes
  - Store layerWeights in form state
  - **File**: `packages/frontend/src/components/BidForm.tsx`

### 10.2 Update BidForm mainStacks input for weighted skills
- [x] 10.2 Update BidForm mainStacks input for weighted skills
  - Update placeholder to show JSON object format with weights
  - Parse JSON object from input
  - Validate structure (object with 6 required keys)
  - Validate each skill has {skill: string, weight: number}
  - Validate skill weights sum to 1.0 per layer (±0.001 tolerance) or layer is empty
  - Show preview of parsed skills by layer with weights
  - Display chips grouped by layer showing skill name and weight
  - **File**: `packages/frontend/src/components/BidForm.tsx`

### 10.3 Add LayerWeightsEditor to BidForm
- [x] 10.3 Add LayerWeightsEditor to BidForm
  - Add LayerWeightsEditor component (optional, collapsible)
  - Pre-fill with default weights from role
  - Allow user to customize
  - Validate before submission
  - **File**: `packages/frontend/src/components/BidForm.tsx`

### 10.4 Update BidForm submission
- [x] 10.4 Update BidForm submission
  - Send weighted skills mainStacks format
  - Send layerWeights (if customized)
  - Handle validation errors (skill weights, layer weights)
  - **File**: `packages/frontend/src/components/BidForm.tsx`

## 11. Frontend - Match Rate Display

### 11.1 Create BidMatchRateDisplay component
- [x] 11.1 Create BidMatchRateDisplay component
  - Display overall match rate as percentage
  - Show layer-by-layer breakdown
  - Display matching skills (green chips)
  - Display missing skills (red chips)
  - Show layer weights
  - Sort by match rate
  - **File**: `packages/frontend/src/components/BidMatchRateDisplay.tsx` (new file)

### 11.2 Add BidMatchRateDisplay to BidList or detail view
- [x] 11.2 Add BidMatchRateDisplay to BidList or detail view
  - Add "Find Similar Bids" button
  - Fetch match rates when clicked
  - Display results in modal or expandable section
  - **File**: `packages/frontend/src/components/BidList.tsx` or create new detail page

## 12. Frontend - Update Existing Components

### 12.1 Update BidList to display weighted skills
- [x] 12.1 Update BidList to display weighted skills
  - Extract skill names from SkillWeight[] for display
  - Or show layer-grouped chips with weights
  - Handle both legacy (flat array) and new (weighted object) formats
  - **File**: `packages/frontend/src/components/BidList.tsx`

### 12.2 Update ResumeSelector for weighted skills
- [x] 12.2 Update ResumeSelector for weighted skills
  - Accept LayerSkills (weighted) as techStack prop
  - Extract skill names for matching logic
  - **File**: `packages/frontend/src/components/ResumeSelector.tsx`

## 13. Testing and Validation

### 13.1 Run all backend tests
- [ ] 13.1 Run all backend tests
  - Run unit tests: `npm test`
  - Run property-based tests
  - Ensure all tests pass
  - **Command**: `cd packages/backend && npm test`

### 13.2 Run all frontend tests
- [ ] 13.2 Run all frontend tests
  - Run component tests: `npm test`
  - Ensure all tests pass
  - **Command**: `cd packages/frontend && npm test`

### 13.3 Manual testing
- [ ] 13.3 Manual testing
  - Create bid with different roles
  - Verify layer weights auto-populate correctly
  - Customize layer weights
  - Test JSON object with weighted skills input
  - Verify skill weights validation (must sum to 1.0 per layer)
  - Calculate match rates
  - Verify weighted match rate calculation is correct
  - Test with Full Stack Engineer roles (all 3 modifiers)
  - Test example from design: React (0.5 × 0.7 = 0.35)

## 14. Documentation

### 14.1 Update API documentation
- [ ] 14.1 Update API documentation
  - Document new bid creation format with weighted skills
  - Document match rate endpoint
  - Add examples for JSON object with skill weights
  - Explain weighted product formula
  - **File**: `packages/backend/README.md` or API docs

### 14.2 Update User Guide
- [x] 14.2 Update User Guide
  - Add section on role selection
  - Explain layer weights
  - Show weighted skills format with examples
  - Explain weighted match rate calculation formula
  - Add example calculation walkthrough
  - **File**: `packages/frontend/src/pages/UserGuidePage.tsx`

## 15. Deployment

### 15.1 Run data migration
- [ ] 15.1 Run data migration
  - Backup database
  - Run migration script in dry-run mode
  - Review changes
  - Run actual migration
  - Verify data integrity
  - **Script**: `packages/backend/src/infrastructure/migrations/migrate-bids-to-layer-weights.ts`

### 15.2 Deploy backend
- [ ] 15.2 Deploy backend
  - Build backend: `npm run build`
  - Deploy to production
  - Verify API endpoints work

### 15.3 Deploy frontend
- [ ] 15.3 Deploy frontend
  - Build frontend: `npm run build`
  - Deploy to production
  - Verify UI works correctly
