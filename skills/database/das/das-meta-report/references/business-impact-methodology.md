# Business Impact Analysis Methodology

## Core Principles

1. **Preserve Original Content**: Never modify or remove original DAS report content
2. **Add Business Context Only**: Only add business impact analysis where technical issues exist
3. **Use Verified Data**: Only use business descriptions from Meta Agent data asset inventory
4. **Maintain Report Structure**: Keep all original tables, sections, and formatting

## Business Impact Categories

### Storage Space Issues
- **User Impact**: Registration, login, profile queries affected
- **Business Impact**: New user acquisition blocked, existing user experience degraded
- **Revenue Impact**: Direct impact on conversion rates and GMV

### Performance Issues (Slow SQL, Index Problems)
- **User Impact**: Order creation, payment processing, product browsing delayed
- **Business Impact**: Cart abandonment, reduced transaction success rate
- **Revenue Impact**: Direct GMV loss during peak hours

### Security Compliance Issues  
- **User Impact**: Data privacy and security concerns
- **Business Impact**: Regulatory compliance violations, brand reputation damage
- **Legal Impact**: GDPR/Personal Information Protection Law violations, potential fines

### Test Environment Issues
- **Development Impact**: Feature testing blocked, release cycles delayed
- **Business Impact**: Product iteration slowed, competitive disadvantage
- **Operational Impact**: Production incident investigation hampered

## Mapping Technical to Business

| Technical Issue | Business Function | Business Impact |
|----------------|------------------|-----------------|
| orders table index redundancy | Order creation | User checkout delay → cart abandonment |
| user database storage full | User registration/login | New user acquisition blocked |
| test environment storage full | Feature testing | Product release delays |
| missing security compliance | Data protection | Regulatory violations, reputation damage |

## Output Guidelines

- Use concrete business terms (GMV, conversion rate, user acquisition)
- Reference specific business functions (order creation, user registration, payment processing)
- Include data sensitivity context (personal information, payment data, order history)
- Maintain professional tone while being specific about business consequences