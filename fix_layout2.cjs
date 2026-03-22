const fs = require('fs');
const code = fs.readFileSync('src/pages/ProjectDetail.tsx', 'utf8');

let newCode = code;

// Fix Status
newCode = newCode.replace(
  /at \{new Date\(project\.updatedAt\)\.toLocaleTimeString\(\)\}<\/p>\s+<\/SortableWidget>/g,
  `at {new Date(project.updatedAt).toLocaleTimeString()}</p>
              </div>
            </div>
                    </SortableWidget>`
);

// Fix Strategy
newCode = newCode.replace(
  /<Plus className="w-3 h-3" \/> Add Tag\s+<\/SortableWidget>/g,
  `<Plus className="w-3 h-3" /> Add Tag
                    </button>
                  </div>
                </div>
              </div>
            </div>
                    </SortableWidget>`
);

// Fix Focus
newCode = newCode.replace(
  /No improvement focus defined\.<\/div>\s+<\/SortableWidget>/g,
  `No improvement focus defined.</div>
                )}
              </div>
            </div>
                    </SortableWidget>`
);

// Fix Journeys
newCode = newCode.replace(
  /No implemented maps yet\.<\/div>\s+<\/SortableWidget>/g,
  `No implemented maps yet.</div>
                )}
              </div>
            </div>
                    </SortableWidget>`
);

// Fix Process Maps
newCode = newCode.replace(
  /No process maps yet\.<\/div>\s+<\/SortableWidget>/g,
  `No process maps yet.</div>
                )}
              </div>
            </div>
                    </SortableWidget>`
);

// Fix RAID
newCode = newCode.replace(
  /No RAID items identified yet\.<\/div>\s+<\/SortableWidget>/g,
  `No RAID items identified yet.</div>
                )}
              </div>
            </div>
                    </SortableWidget>`
);

fs.writeFileSync('src/pages/ProjectDetail.tsx', newCode);
console.log('Fixed');
