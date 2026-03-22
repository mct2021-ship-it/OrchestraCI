const fs = require('fs');
const code = fs.readFileSync('src/pages/ProjectDetail.tsx', 'utf8');

let newCode = code;

// Fix Personas
newCode = newCode.replace(
  'No personas selected for this project.\n      \n                    </SortableWidget>',
  `No personas selected for this project.
                    </div>
                  )}
                </div>
              )}
            </div>
                    </SortableWidget>`
);

// Fix Team
newCode = newCode.replace(
  'No team members added yet.</div>\n\n                    </SortableWidget>',
  `No team members added yet.</div>
                )}
              </div>
            </div>
                    </SortableWidget>`
);

// Fix Status
newCode = newCode.replace(
  'at {new Date(project.updatedAt).toLocaleTimeString()}</p>\n\n                    </SortableWidget>',
  `at {new Date(project.updatedAt).toLocaleTimeString()}</p>
              </div>
            </div>
                    </SortableWidget>`
);

// Fix Strategy
newCode = newCode.replace(
  '<Plus className="w-3 h-3" /> Add Tag\n\n                    </SortableWidget>',
  `<Plus className="w-3 h-3" /> Add Tag
                    </button>
                  </div>
                </div>
              </div>
            </div>
                    </SortableWidget>`
);

// Fix Goals
newCode = newCode.replace(
  /<EditableTe\n                    <\/SortableWidget>/,
  `<EditableText
                              value={outcome}
                              onChange={(val) => {
                                const newOutcomes = [...project.expectedOutcomes];
                                newOutcomes[i] = val;
                                updateProjectField('expectedOutcomes', newOutcomes);
                              }}
                              className="flex-1 text-sm"
                            />
                            <button
                              onClick={() => {
                                const newOutcomes = project.expectedOutcomes.filter((_, index) => index !== i);
                                updateProjectField('expectedOutcomes', newOutcomes);
                              }}
                              className="p-1 text-zinc-400 hover:text-rose-600 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-sm leading-relaxed">{outcome}</span>
                        )}
                      </li>
                    ))}
                    {(project.expectedOutcomes || []).length === 0 && (
                      <li className="text-sm text-zinc-400 italic">No expected outcomes defined.</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
                    </SortableWidget>`
);

// Fix Focus
newCode = newCode.replace(
  'No improvement focus defined.</div>\n\n                    </SortableWidget>',
  `No improvement focus defined.</div>
                )}
              </div>
            </div>
                    </SortableWidget>`
);

// Fix Journeys
newCode = newCode.replace(
  'No implemented maps yet.</div>\n\n                    </SortableWidget>',
  `No implemented maps yet.</div>
                )}
              </div>
            </div>
                    </SortableWidget>`
);

// Fix Process Maps
newCode = newCode.replace(
  'No process maps yet.</div>\n\n                    </SortableWidget>',
  `No process maps yet.</div>
                )}
              </div>
            </div>
                    </SortableWidget>`
);

// Fix RAID
newCode = newCode.replace(
  'No RAID items identified yet.</div>\n\n                    </SortableWidget>',
  `No RAID items identified yet.</div>
                )}
              </div>
            </div>
                    </SortableWidget>`
);

fs.writeFileSync('src/pages/ProjectDetail.tsx', newCode);
console.log('Fixed');
